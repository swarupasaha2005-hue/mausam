import { RecommendationError } from '@cloud6/shared';
import { recommendationsService } from './recommendationsService';

const CONTEXT = {
  persona: 'runner' as const,
  activities: ['running' as const],
  preferredTimeOfDay: 'morning' as const,
  weatherPriorities: ['temperature' as const],
};

const WEATHER = {
  temperature: 24,
  feelsLike: 25,
  humidity: 50,
  precipitation: 0,
  rainProbability: 5,
  windSpeed: 10,
  windDirection: 180,
  uvIndex: 3,
  visibility: 10,
  weatherCode: 'clear' as const,
  timestamp: '2026-09-01T12:00',
};

function mockFetch(impl: () => Promise<Response> | Response) {
  globalThis.fetch = jest.fn(impl) as unknown as typeof fetch;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('recommendationsService.generate', () => {
  it('calls the CLOUD6 backend and returns the result', async () => {
    const result = {
      primaryRecommendation: {
        type: 'FAVORABLE',
        priority: 'low',
        title: 't',
        message: 'm',
        action: 'a',
        reasons: [],
      },
      recommendations: [],
      evaluatedFactors: [],
    };
    mockFetch(() => new Response(JSON.stringify(result), { status: 200 }));

    const response = await recommendationsService.generate(CONTEXT, WEATHER);

    expect(response).toEqual(result);
    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/recommendations');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ context: CONTEXT, weather: WEATHER });
  });

  it('normalizes a backend error response into a RecommendationError with the backend code', async () => {
    mockFetch(
      () =>
        new Response(JSON.stringify({ error: { code: 'RECOMMENDATION_INVALID_CONTEXT' } }), {
          status: 400,
        }),
    );

    await expect(recommendationsService.generate(CONTEXT, WEATHER)).rejects.toBeInstanceOf(
      RecommendationError,
    );
    await expect(recommendationsService.generate(CONTEXT, WEATHER)).rejects.toMatchObject({
      code: 'RECOMMENDATION_INVALID_CONTEXT',
    });
  });

  it('normalizes a network failure', async () => {
    mockFetch(() => Promise.reject(new Error('Network request failed')));

    await expect(recommendationsService.generate(CONTEXT, WEATHER)).rejects.toBeInstanceOf(
      RecommendationError,
    );
  });
});
