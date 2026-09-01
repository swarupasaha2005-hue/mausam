import { WeatherError } from '@cloud6/shared';
import { WeatherService } from './weather.service';
import type { WeatherProvider } from './weather.types';
import {
  cloud6CurrentWeatherFixture,
  cloud6DailyWeatherFixture,
  cloud6HourlyWeatherFixture,
} from '../../../test/fixtures/cloud6/weather';

const VALID_POINT = { latitude: 22.5726, longitude: 88.3639 };
const INVALID_POINT = { latitude: 999, longitude: 0 };

function createProvider(overrides: Partial<WeatherProvider> = {}): WeatherProvider {
  return {
    getCurrentWeather: jest.fn().mockResolvedValue(cloud6CurrentWeatherFixture),
    getHourlyForecast: jest.fn().mockResolvedValue(cloud6HourlyWeatherFixture),
    getDailyForecast: jest.fn().mockResolvedValue(cloud6DailyWeatherFixture),
    getAirQuality: jest.fn().mockResolvedValue({
      location: VALID_POINT,
      aqi: 58,
      pm2_5: 14.2,
      pm10: 22.5,
      timestamp: 't',
    }),
    ...overrides,
  };
}

describe('WeatherService coordinate validation', () => {
  it.each([
    ['getCurrentWeather', (s: WeatherService) => s.getCurrentWeather(INVALID_POINT)],
    ['getHourlyForecast', (s: WeatherService) => s.getHourlyForecast(INVALID_POINT)],
    ['getDailyForecast', (s: WeatherService) => s.getDailyForecast(INVALID_POINT)],
    ['getAirQuality', (s: WeatherService) => s.getAirQuality(INVALID_POINT)],
  ])('%s rejects invalid coordinates without calling the provider', async (_name, call) => {
    const provider = createProvider();
    const service = new WeatherService(provider);

    await expect(call(service)).rejects.toMatchObject({ code: 'WEATHER_INVALID_COORDINATES' });
    expect(provider.getCurrentWeather).not.toHaveBeenCalled();
    expect(provider.getHourlyForecast).not.toHaveBeenCalled();
    expect(provider.getDailyForecast).not.toHaveBeenCalled();
    expect(provider.getAirQuality).not.toHaveBeenCalled();
  });
});

describe('WeatherService delegates to the provider, not to Open-Meteo directly', () => {
  it('getCurrentWeather calls provider.getCurrentWeather', async () => {
    const provider = createProvider();
    const service = new WeatherService(provider);

    const result = await service.getCurrentWeather(VALID_POINT);

    expect(provider.getCurrentWeather).toHaveBeenCalledWith(VALID_POINT);
    expect(result).toEqual(cloud6CurrentWeatherFixture);
  });

  it('getHourlyForecast calls provider.getHourlyForecast', async () => {
    const provider = createProvider();
    const service = new WeatherService(provider);

    const result = await service.getHourlyForecast(VALID_POINT, { hours: 12 });

    expect(provider.getHourlyForecast).toHaveBeenCalledWith(VALID_POINT, { hours: 12 });
    expect(result).toEqual(cloud6HourlyWeatherFixture);
  });

  it('getDailyForecast calls provider.getDailyForecast', async () => {
    const provider = createProvider();
    const service = new WeatherService(provider);

    const result = await service.getDailyForecast(VALID_POINT, { days: 3 });

    expect(provider.getDailyForecast).toHaveBeenCalledWith(VALID_POINT, { days: 3 });
    expect(result).toEqual(cloud6DailyWeatherFixture);
  });

  it('normalizes a provider failure into a WeatherError', async () => {
    const provider = createProvider({
      getCurrentWeather: jest.fn().mockRejectedValue(new Error('boom')),
    });
    const service = new WeatherService(provider);

    await expect(service.getCurrentWeather(VALID_POINT)).rejects.toBeInstanceOf(WeatherError);
    await expect(service.getCurrentWeather(VALID_POINT)).rejects.toMatchObject({
      code: 'WEATHER_PROVIDER_ERROR',
    });
  });

  it('passes through an already-normalized WeatherError from the provider', async () => {
    const provider = createProvider({
      getCurrentWeather: jest.fn().mockRejectedValue(new WeatherError('WEATHER_TIMEOUT')),
    });
    const service = new WeatherService(provider);

    await expect(service.getCurrentWeather(VALID_POINT)).rejects.toMatchObject({
      code: 'WEATHER_TIMEOUT',
    });
  });
});

describe('WeatherService caching', () => {
  it('serves a repeated request from cache without calling the provider again', async () => {
    const provider = createProvider();
    const service = new WeatherService(provider);

    await service.getCurrentWeather(VALID_POINT);
    await service.getCurrentWeather(VALID_POINT);

    expect(provider.getCurrentWeather).toHaveBeenCalledTimes(1);
  });

  it('does not collide cache entries for different coordinates', async () => {
    const provider = createProvider();
    const service = new WeatherService(provider);
    const otherPoint = { latitude: 12.9716, longitude: 77.5946 };

    await service.getCurrentWeather(VALID_POINT);
    await service.getCurrentWeather(otherPoint);

    expect(provider.getCurrentWeather).toHaveBeenCalledTimes(2);
  });

  it('fetches fresh data again once the cache entry expires', async () => {
    jest.useFakeTimers();
    try {
      const provider = createProvider();
      const service = new WeatherService(provider);

      await service.getCurrentWeather(VALID_POINT);
      jest.advanceTimersByTime(3 * 60 * 1000); // beyond the 2-minute current-weather TTL
      await service.getCurrentWeather(VALID_POINT);

      expect(provider.getCurrentWeather).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('WeatherService.getWeatherAt', () => {
  it('returns the hourly entry closest to the requested timestamp', async () => {
    const provider = createProvider();
    const service = new WeatherService(provider);

    const result = await service.getWeatherAt(VALID_POINT, '2026-09-01T13:20');

    expect(result).toEqual(cloud6HourlyWeatherFixture[2]);
  });
});
