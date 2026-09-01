import request from 'supertest';
import { app } from '../app';

describe('POST /api/personalization/context', () => {
  it('returns a normalized context for a valid request', async () => {
    const response = await request(app)
      .post('/api/personalization/context')
      .send({ persona: 'runner', preferredTimeOfDay: 'morning' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      persona: 'runner',
      activities: ['running'],
      preferredTimeOfDay: 'morning',
      weatherPriorities: expect.arrayContaining(['temperature', 'humidity']),
    });
  });

  it('defaults preferredTimeOfDay when omitted', async () => {
    const response = await request(app)
      .post('/api/personalization/context')
      .send({ persona: 'commuter' });

    expect(response.status).toBe(200);
    expect(response.body.preferredTimeOfDay).toBe('flexible');
  });

  it('returns 400 for an invalid persona', async () => {
    const response = await request(app)
      .post('/api/personalization/context')
      .send({ persona: 'astronaut' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('PERSONA_INVALID');
  });

  it('returns 400 for an invalid preferred time of day', async () => {
    const response = await request(app)
      .post('/api/personalization/context')
      .send({ persona: 'runner', preferredTimeOfDay: 'noon' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('TIME_INVALID');
  });

  it('returns 400 for a malformed request (missing persona)', async () => {
    const response = await request(app).post('/api/personalization/context').send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('PERSONA_INVALID');
  });

  it('returns 400 for an invalid activity', async () => {
    const response = await request(app)
      .post('/api/personalization/context')
      .send({ persona: 'runner', activities: ['sleeping'] });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('ACTIVITY_INVALID');
  });
});
