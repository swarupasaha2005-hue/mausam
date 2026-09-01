import request from 'supertest';
import { app } from '../app';
import { tenKmRouteFixture } from '../../test/fixtures/cloud6/journey';

describe('POST /api/journey/plan', () => {
  it('returns a normalized JourneyPlan for a valid request', async () => {
    const response = await request(app)
      .post('/api/journey/plan')
      .send({ route: tenKmRouteFixture, departureTime: '2026-09-01T16:00:00.000Z' });

    expect(response.status).toBe(200);
    expect(response.body.route).toEqual(tenKmRouteFixture);
    expect(response.body.departureTime).toBe('2026-09-01T16:00:00.000Z');
    expect(Array.isArray(response.body.checkpoints)).toBe(true);
    expect(response.body.checkpoints.length).toBeGreaterThan(1);
  });

  it('returns 400 for an invalid route', async () => {
    const response = await request(app)
      .post('/api/journey/plan')
      .send({ route: { ...tenKmRouteFixture, coordinates: [] } });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('JOURNEY_INVALID_ROUTE');
  });

  it('returns 400 for an invalid departureTime', async () => {
    const response = await request(app)
      .post('/api/journey/plan')
      .send({ route: tenKmRouteFixture, departureTime: 'not-a-date' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('JOURNEY_INVALID_DEPARTURE_TIME');
  });

  it('returns 400 for invalid sampling options', async () => {
    const response = await request(app)
      .post('/api/journey/plan')
      .send({ route: tenKmRouteFixture, options: { maxCheckpoints: 1 } });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('JOURNEY_INVALID_OPTIONS');
  });

  it('returns 400 for a missing route', async () => {
    const response = await request(app).post('/api/journey/plan').send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('JOURNEY_INVALID_ROUTE');
  });
});
