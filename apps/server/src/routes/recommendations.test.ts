import request from 'supertest';
import { app } from '../app';
import {
  favorableWeatherFixture,
  runnerContextFixture,
} from '../../test/fixtures/cloud6/recommendation';

describe('POST /api/recommendations', () => {
  it('returns a RecommendationResult for valid input', async () => {
    const response = await request(app)
      .post('/api/recommendations')
      .send({ context: runnerContextFixture, weather: favorableWeatherFixture });

    expect(response.status).toBe(200);
    expect(response.body.primaryRecommendation).toBeTruthy();
    expect(Array.isArray(response.body.recommendations)).toBe(true);
    expect(Array.isArray(response.body.evaluatedFactors)).toBe(true);
  });

  it('returns 400 for an invalid context (bad persona)', async () => {
    const response = await request(app)
      .post('/api/recommendations')
      .send({
        context: { ...runnerContextFixture, persona: 'astronaut' },
        weather: favorableWeatherFixture,
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('RECOMMENDATION_INVALID_CONTEXT');
  });

  it('returns 400 for invalid weather', async () => {
    const response = await request(app)
      .post('/api/recommendations')
      .send({
        context: runnerContextFixture,
        weather: { ...favorableWeatherFixture, humidity: 500 },
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('RECOMMENDATION_INVALID_WEATHER');
  });

  it('returns 400 for missing fields', async () => {
    const response = await request(app).post('/api/recommendations').send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('RECOMMENDATION_INVALID_CONTEXT');
  });
});
