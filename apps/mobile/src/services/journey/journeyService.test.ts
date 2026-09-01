import { JourneyError } from '@cloud6/shared';
import { journeyService } from './journeyService';

const ROUTE = {
  start: { latitude: 22.5726, longitude: 88.3639 },
  destination: { latitude: 22.5958, longitude: 88.4497 },
  distanceKm: 10,
  durationMinutes: 30,
  coordinates: [
    { latitude: 22.5726, longitude: 88.3639 },
    { latitude: 22.5958, longitude: 88.4497 },
  ],
};

function mockFetch(impl: () => Promise<Response> | Response) {
  globalThis.fetch = jest.fn(impl) as unknown as typeof fetch;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('journeyService.planJourney', () => {
  it('calls the CLOUD6 backend and returns the plan', async () => {
    const plan = {
      route: ROUTE,
      departureTime: '2026-09-01T16:00:00.000Z',
      estimatedArrivalTime: '2026-09-01T16:30:00.000Z',
      durationMinutes: 30,
      checkpoints: [],
    };
    mockFetch(() => new Response(JSON.stringify(plan), { status: 200 }));

    const result = await journeyService.planJourney(ROUTE, '2026-09-01T16:00:00.000Z');

    expect(result).toEqual(plan);
    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/journey/plan');
    expect(init.method).toBe('POST');
  });

  it('normalizes a backend error response into a JourneyError with the backend code', async () => {
    mockFetch(
      () =>
        new Response(JSON.stringify({ error: { code: 'JOURNEY_INVALID_ROUTE' } }), { status: 400 }),
    );

    await expect(journeyService.planJourney(ROUTE)).rejects.toBeInstanceOf(JourneyError);
    await expect(journeyService.planJourney(ROUTE)).rejects.toMatchObject({
      code: 'JOURNEY_INVALID_ROUTE',
    });
  });

  it('normalizes a network failure', async () => {
    mockFetch(() => Promise.reject(new Error('Network request failed')));

    await expect(journeyService.planJourney(ROUTE)).rejects.toBeInstanceOf(JourneyError);
  });
});
