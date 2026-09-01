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

const JOURNEY_PLAN = {
  route: ROUTE,
  departureTime: '2026-09-01T16:00:00.000Z',
  estimatedArrivalTime: '2026-09-01T16:30:00.000Z',
  durationMinutes: 30,
  checkpoints: [],
};

describe('journeyService.getJourneyWeather', () => {
  it('calls the CLOUD6 backend (/api/journey/weather), not Open-Meteo', async () => {
    const journeyWeatherPlan = {
      ...JOURNEY_PLAN,
      summary: {
        weatherAvailableCheckpoints: 0,
        weatherUnavailableCheckpoints: 0,
        rainAffectedCheckpointCount: 0,
        firstRainCheckpointSequence: null,
        transitions: [],
      },
    };
    mockFetch(() => new Response(JSON.stringify(journeyWeatherPlan), { status: 200 }));

    const result = await journeyService.getJourneyWeather(JOURNEY_PLAN);

    expect(result).toEqual(journeyWeatherPlan);
    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/journey/weather');
    expect(url).not.toContain('open-meteo.com');
    expect(JSON.parse(init.body)).toEqual({ journeyPlan: JOURNEY_PLAN });
  });

  it('normalizes a backend error response into a JourneyError', async () => {
    mockFetch(
      () =>
        new Response(JSON.stringify({ error: { code: 'JOURNEY_INVALID_ROUTE' } }), { status: 400 }),
    );

    await expect(journeyService.getJourneyWeather(JOURNEY_PLAN)).rejects.toBeInstanceOf(
      JourneyError,
    );
  });

  it('normalizes a network failure', async () => {
    mockFetch(() => Promise.reject(new Error('Network request failed')));

    await expect(journeyService.getJourneyWeather(JOURNEY_PLAN)).rejects.toBeInstanceOf(
      JourneyError,
    );
  });
});

const USER_CONTEXT = {
  persona: 'runner' as const,
  activities: ['running' as const],
  preferredTimeOfDay: 'flexible' as const,
  weatherPriorities: ['temperature' as const],
};

describe('journeyService.getJourneyIntelligence', () => {
  it('calls the CLOUD6 backend (/api/journey/intelligence), not Open-Meteo', async () => {
    const journeyWeatherPlan = {
      ...JOURNEY_PLAN,
      summary: {
        weatherAvailableCheckpoints: 0,
        weatherUnavailableCheckpoints: 0,
        rainAffectedCheckpointCount: 0,
        firstRainCheckpointSequence: null,
        transitions: [],
      },
    };
    const intelligence = {
      journeyWeatherPlan,
      analysis: {
        riskLevel: 'low',
        primaryConcern: 'Conditions look favorable along your entire route.',
        factors: ['FAVORABLE_JOURNEY'],
        affectedCheckpointSequences: [],
        affectedSegment: null,
        firstAffectedCheckpointSequence: null,
        transitions: [],
        weatherAvailableCheckpoints: 0,
        weatherUnavailableCheckpoints: 0,
        confidence: 'low',
        reasons: [],
      },
      recommendation: {
        type: 'FAVORABLE',
        priority: 'low',
        title: 'Good conditions for your run',
        message: 'Conditions look favorable for your entire route.',
        action: 'Enjoy your run.',
        reasons: ['FAVORABLE_JOURNEY'],
      },
    };
    mockFetch(() => new Response(JSON.stringify(intelligence), { status: 200 }));

    const result = await journeyService.getJourneyIntelligence(journeyWeatherPlan, USER_CONTEXT);

    expect(result).toEqual(intelligence);
    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/journey/intelligence');
    expect(url).not.toContain('open-meteo.com');
    expect(JSON.parse(init.body)).toEqual({ journeyWeatherPlan, userContext: USER_CONTEXT });
  });

  it('normalizes a backend error response into a JourneyError', async () => {
    mockFetch(
      () =>
        new Response(JSON.stringify({ error: { code: 'JOURNEY_INVALID_ROUTE' } }), { status: 400 }),
    );

    await expect(
      journeyService.getJourneyIntelligence(JOURNEY_PLAN as never, USER_CONTEXT),
    ).rejects.toBeInstanceOf(JourneyError);
  });

  it('normalizes a network failure', async () => {
    mockFetch(() => Promise.reject(new Error('Network request failed')));

    await expect(
      journeyService.getJourneyIntelligence(JOURNEY_PLAN as never, USER_CONTEXT),
    ).rejects.toBeInstanceOf(JourneyError);
  });
});
