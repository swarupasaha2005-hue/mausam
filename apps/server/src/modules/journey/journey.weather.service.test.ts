import { JourneyError, WeatherError } from '@cloud6/shared';
import { JourneyWeatherService } from './journey.weather.service';
import {
  journeyPlanFixture,
  makeCheckpoint,
  makeHourlyWeather,
} from '../../../test/fixtures/cloud6/journey';

function createWeatherService(impl?: jest.Mock) {
  return { getWeatherAt: impl ?? jest.fn().mockResolvedValue(makeHourlyWeather()) };
}

describe('JourneyWeatherService.enrichJourneyWeather — single checkpoint', () => {
  it('calls WeatherService.getWeatherAt with the checkpoint point and ETA', async () => {
    const getWeatherAt = jest.fn().mockResolvedValue(makeHourlyWeather());
    const service = new JourneyWeatherService(createWeatherService(getWeatherAt));
    const plan = { ...journeyPlanFixture, checkpoints: [journeyPlanFixture.checkpoints[0]] };

    await service.enrichJourneyWeather(plan);

    expect(getWeatherAt).toHaveBeenCalledWith(
      journeyPlanFixture.checkpoints[0].point,
      journeyPlanFixture.checkpoints[0].estimatedArrivalTime,
    );
  });
});

describe('JourneyWeatherService.enrichJourneyWeather — multiple checkpoints', () => {
  it('performs one weather lookup per checkpoint, using each checkpoint location/ETA', async () => {
    const getWeatherAt = jest.fn().mockResolvedValue(makeHourlyWeather());
    const service = new JourneyWeatherService(createWeatherService(getWeatherAt));

    await service.enrichJourneyWeather(journeyPlanFixture);

    expect(getWeatherAt).toHaveBeenCalledTimes(journeyPlanFixture.checkpoints.length);
    journeyPlanFixture.checkpoints.forEach((checkpoint) => {
      expect(getWeatherAt).toHaveBeenCalledWith(checkpoint.point, checkpoint.estimatedArrivalTime);
    });
  });

  it('preserves checkpoint order even if requests resolve out of order', async () => {
    const getWeatherAt = jest.fn((point, timestamp) => {
      const delay = point.latitude === journeyPlanFixture.checkpoints[0].point.latitude ? 20 : 1;
      return new Promise((resolve) =>
        setTimeout(() => resolve(makeHourlyWeather({ timestamp })), delay),
      );
    });
    const service = new JourneyWeatherService(createWeatherService(getWeatherAt));

    const result = await service.enrichJourneyWeather(journeyPlanFixture);

    expect(result.checkpoints.map((c) => c.sequence)).toEqual([1, 2, 3, 4]);
  });
});

describe('JourneyWeatherService.enrichJourneyWeather — successful enrichment', () => {
  it('attaches weather to every checkpoint', async () => {
    const service = new JourneyWeatherService(createWeatherService());

    const result = await service.enrichJourneyWeather(journeyPlanFixture);

    expect(result.checkpoints).toHaveLength(4);
    result.checkpoints.forEach((checkpoint) => {
      expect(checkpoint.weather).not.toBeNull();
      expect(checkpoint.weatherError).toBeUndefined();
    });
    expect(result.summary.weatherAvailableCheckpoints).toBe(4);
  });

  it('preserves the original route and journey timing', async () => {
    const service = new JourneyWeatherService(createWeatherService());

    const result = await service.enrichJourneyWeather(journeyPlanFixture);

    expect(result.route).toEqual(journeyPlanFixture.route);
    expect(result.departureTime).toBe(journeyPlanFixture.departureTime);
    expect(result.estimatedArrivalTime).toBe(journeyPlanFixture.estimatedArrivalTime);
    expect(result.durationMinutes).toBe(journeyPlanFixture.durationMinutes);
  });
});

describe('JourneyWeatherService.enrichJourneyWeather — partial weather failure', () => {
  it('preserves all checkpoints, marking the failed one unavailable rather than dropping it', async () => {
    const getWeatherAt = jest.fn((point) => {
      if (point.latitude === journeyPlanFixture.checkpoints[2].point.latitude) {
        return Promise.reject(new WeatherError('WEATHER_TIMEOUT'));
      }
      return Promise.resolve(makeHourlyWeather());
    });
    const service = new JourneyWeatherService(createWeatherService(getWeatherAt));

    const result = await service.enrichJourneyWeather(journeyPlanFixture);

    expect(result.checkpoints).toHaveLength(4);
    expect(result.checkpoints[0].weather).not.toBeNull();
    expect(result.checkpoints[1].weather).not.toBeNull();
    expect(result.checkpoints[2].weather).toBeNull();
    expect(result.checkpoints[2].weatherError).toEqual({
      code: 'WEATHER_TIMEOUT',
      message: 'WEATHER_TIMEOUT',
    });
    expect(result.checkpoints[3].weather).not.toBeNull();
    expect(result.summary.weatherAvailableCheckpoints).toBe(3);
    expect(result.summary.weatherUnavailableCheckpoints).toBe(1);
  });
});

describe('JourneyWeatherService.enrichJourneyWeather — complete weather failure', () => {
  it('preserves the journey plan without generating fake weather', async () => {
    const getWeatherAt = jest.fn().mockRejectedValue(new WeatherError('WEATHER_PROVIDER_ERROR'));
    const service = new JourneyWeatherService(createWeatherService(getWeatherAt));

    const result = await service.enrichJourneyWeather(journeyPlanFixture);

    expect(result.route).toEqual(journeyPlanFixture.route);
    expect(result.checkpoints).toHaveLength(4);
    result.checkpoints.forEach((checkpoint) => {
      expect(checkpoint.weather).toBeNull();
      expect(checkpoint.weatherError).toBeDefined();
    });
    expect(result.summary.weatherAvailableCheckpoints).toBe(0);
    expect(result.summary.weatherUnavailableCheckpoints).toBe(4);
  });
});

describe('JourneyWeatherService.enrichJourneyWeather — invalid input', () => {
  const service = new JourneyWeatherService(createWeatherService());

  it('throws JourneyError for a missing journeyPlan', async () => {
    await expect(service.enrichJourneyWeather(undefined)).rejects.toBeInstanceOf(JourneyError);
  });

  it('throws JourneyError for missing checkpoints', async () => {
    await expect(
      service.enrichJourneyWeather({ ...journeyPlanFixture, checkpoints: [] }),
    ).rejects.toMatchObject({ code: 'JOURNEY_INVALID_ROUTE' });
  });

  it('throws JourneyError for a malformed checkpoint', async () => {
    await expect(
      service.enrichJourneyWeather({
        ...journeyPlanFixture,
        checkpoints: [makeCheckpoint({ point: { latitude: 999, longitude: 0 } })],
      }),
    ).rejects.toMatchObject({ code: 'JOURNEY_INVALID_ROUTE' });
  });

  it('throws JOURNEY_INVALID_DEPARTURE_TIME for an invalid departureTime', async () => {
    await expect(
      service.enrichJourneyWeather({ ...journeyPlanFixture, departureTime: 'not-a-date' }),
    ).rejects.toMatchObject({ code: 'JOURNEY_INVALID_DEPARTURE_TIME' });
  });
});

describe('JourneyWeatherService — short journey', () => {
  it('enriches a 2-checkpoint (short-route) plan without issue', async () => {
    const service = new JourneyWeatherService(createWeatherService());
    const shortPlan = {
      ...journeyPlanFixture,
      checkpoints: [journeyPlanFixture.checkpoints[0], journeyPlanFixture.checkpoints[3]],
    };

    const result = await service.enrichJourneyWeather(shortPlan);

    expect(result.checkpoints).toHaveLength(2);
    expect(result.checkpoints.every((c) => c.weather !== null)).toBe(true);
  });
});
