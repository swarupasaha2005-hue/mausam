import request from 'supertest';
import { JourneyError } from '@cloud6/shared';
import { runnerContextFixture } from '../../test/fixtures/cloud6/recommendation';
import { deterioratingJourneyWeatherPlanFixture } from '../../test/fixtures/cloud6/journey';

jest.mock('../modules/journey/journey.analysis.service', () => ({
  journeyAnalysisService: { generateIntelligence: jest.fn() },
}));

import { app } from '../app';
import { journeyAnalysisService } from '../modules/journey/journey.analysis.service';

const mockedService = jest.mocked(journeyAnalysisService);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/journey/intelligence', () => {
  it('returns a normalized JourneyIntelligence for valid input', async () => {
    const intelligence = {
      journeyWeatherPlan: deterioratingJourneyWeatherPlanFixture,
      analysis: {
        riskLevel: 'severe' as const,
        primaryConcern: 'Thunderstorm conditions are detected along your journey.',
        factors: ['THUNDERSTORM_DURING_JOURNEY' as const],
        affectedCheckpointSequences: [5],
        affectedSegment: { fromDistanceKm: 7.2, toDistanceKm: 7.2 },
        firstAffectedCheckpointSequence: 5,
        transitions: [],
        weatherAvailableCheckpoints: 7,
        weatherUnavailableCheckpoints: 0,
        confidence: 'high' as const,
        reasons: ['Thunderstorm conditions are detected along your journey.'],
      },
      recommendation: {
        type: 'AVOID' as const,
        priority: 'severe' as const,
        title: 'Thunderstorm along your route',
        message: 'Thunderstorm conditions are expected during your run.',
        action: 'Postpone your run until conditions clear.',
        reasons: ['THUNDERSTORM_DURING_JOURNEY' as const],
      },
    };
    mockedService.generateIntelligence.mockReturnValue(intelligence);

    const response = await request(app)
      .post('/api/journey/intelligence')
      .send({
        journeyWeatherPlan: deterioratingJourneyWeatherPlanFixture,
        userContext: runnerContextFixture,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(intelligence);
    expect(mockedService.generateIntelligence).toHaveBeenCalledWith({
      journeyWeatherPlan: deterioratingJourneyWeatherPlanFixture,
      userContext: runnerContextFixture,
    });
  });

  it('returns 400 for invalid journey data', async () => {
    mockedService.generateIntelligence.mockImplementation(() => {
      throw new JourneyError(
        'JOURNEY_INVALID_ROUTE',
        'journeyWeatherPlan.checkpoints must be a non-empty array',
      );
    });

    const response = await request(app)
      .post('/api/journey/intelligence')
      .send({
        journeyWeatherPlan: { ...deterioratingJourneyWeatherPlanFixture, checkpoints: [] },
        userContext: runnerContextFixture,
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('JOURNEY_INVALID_ROUTE');
  });

  it('returns 400 for an invalid persona', async () => {
    mockedService.generateIntelligence.mockImplementation(() => {
      throw new JourneyError('JOURNEY_INVALID_ROUTE', 'Unknown persona: astronaut');
    });

    const response = await request(app)
      .post('/api/journey/intelligence')
      .send({
        journeyWeatherPlan: deterioratingJourneyWeatherPlanFixture,
        userContext: { ...runnerContextFixture, persona: 'astronaut' },
      });

    expect(response.status).toBe(400);
  });

  it('returns 400 for a missing body', async () => {
    mockedService.generateIntelligence.mockImplementation(() => {
      throw new JourneyError('JOURNEY_INVALID_ROUTE', 'journeyWeatherPlan is required');
    });

    const response = await request(app).post('/api/journey/intelligence').send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('JOURNEY_INVALID_ROUTE');
  });

  it('returns 400 for a malformed checkpoint', async () => {
    mockedService.generateIntelligence.mockImplementation(() => {
      throw new JourneyError(
        'JOURNEY_INVALID_ROUTE',
        'journeyWeatherPlan.checkpoints contains an invalid checkpoint',
      );
    });

    const response = await request(app)
      .post('/api/journey/intelligence')
      .send({
        journeyWeatherPlan: {
          ...deterioratingJourneyWeatherPlanFixture,
          checkpoints: [{ sequence: 1 }],
        },
        userContext: runnerContextFixture,
      });

    expect(response.status).toBe(400);
  });
});
