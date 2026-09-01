import request from 'supertest';
import { JourneyError } from '@cloud6/shared';
import { journeyPlanFixture } from '../../test/fixtures/cloud6/journey';

jest.mock('../modules/journey/journey.weather.service', () => ({
  journeyWeatherService: { enrichJourneyWeather: jest.fn() },
}));

import { app } from '../app';
import { journeyWeatherService } from '../modules/journey/journey.weather.service';

const mockedService = jest.mocked(journeyWeatherService);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/journey/weather', () => {
  it('returns a normalized JourneyWeatherPlan for a valid journeyPlan', async () => {
    const enriched = {
      ...journeyPlanFixture,
      checkpoints: [],
      summary: {
        weatherAvailableCheckpoints: 0,
        weatherUnavailableCheckpoints: 0,
        rainAffectedCheckpointCount: 0,
        firstRainCheckpointSequence: null,
        transitions: [],
      },
    };
    mockedService.enrichJourneyWeather.mockResolvedValue(enriched);

    const response = await request(app)
      .post('/api/journey/weather')
      .send({ journeyPlan: journeyPlanFixture });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(enriched);
    expect(mockedService.enrichJourneyWeather).toHaveBeenCalledWith(journeyPlanFixture);
  });

  it('returns 400 for an invalid journey plan', async () => {
    mockedService.enrichJourneyWeather.mockRejectedValue(
      new JourneyError(
        'JOURNEY_INVALID_ROUTE',
        'journeyPlan.checkpoints must be a non-empty array',
      ),
    );

    const response = await request(app)
      .post('/api/journey/weather')
      .send({ journeyPlan: { ...journeyPlanFixture, checkpoints: [] } });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('JOURNEY_INVALID_ROUTE');
  });

  it('returns 400 for a missing journeyPlan', async () => {
    mockedService.enrichJourneyWeather.mockRejectedValue(
      new JourneyError('JOURNEY_INVALID_ROUTE', 'journeyPlan is required'),
    );

    const response = await request(app).post('/api/journey/weather').send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('JOURNEY_INVALID_ROUTE');
  });

  it('returns 400 for an invalid departureTime', async () => {
    mockedService.enrichJourneyWeather.mockRejectedValue(
      new JourneyError('JOURNEY_INVALID_DEPARTURE_TIME'),
    );

    const response = await request(app)
      .post('/api/journey/weather')
      .send({ journeyPlan: { ...journeyPlanFixture, departureTime: 'not-a-date' } });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('JOURNEY_INVALID_DEPARTURE_TIME');
  });
});
