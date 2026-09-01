import {
  JourneyError,
  type JourneyErrorCode,
  type JourneyPlan,
  type JourneyWeatherPlan,
  type Route,
  type SampleRouteOptions,
} from '@cloud6/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    throw new JourneyError(
      'JOURNEY_INVALID_ROUTE',
      cause instanceof Error ? cause.message : 'Network request to CLOUD6 backend failed',
    );
  }

  if (!response.ok) {
    let code: JourneyErrorCode = 'JOURNEY_INVALID_ROUTE';
    try {
      const responseBody = (await response.json()) as { error?: { code?: JourneyErrorCode } };
      if (responseBody?.error?.code) {
        code = responseBody.error.code;
      }
    } catch {
      // response body wasn't JSON — fall back to the generic code above.
    }
    throw new JourneyError(code, `CLOUD6 backend responded with HTTP ${response.status}`);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new JourneyError('JOURNEY_INVALID_ROUTE', 'CLOUD6 backend response was not valid JSON');
  }
}

/**
 * Mobile-side journey client. Calls the CLOUD6 backend
 * (`/api/journey/plan`, `/api/journey/weather`) — route sampling,
 * timeline math, and weather enrichment all stay on the backend; this
 * file contains none of that logic and never calls Open-Meteo.
 */
export const journeyService = {
  planJourney(
    route: Route,
    departureTime?: string,
    options?: SampleRouteOptions,
  ): Promise<JourneyPlan> {
    return postJson<JourneyPlan>('/api/journey/plan', { route, departureTime, options });
  },

  getJourneyWeather(journeyPlan: JourneyPlan): Promise<JourneyWeatherPlan> {
    return postJson<JourneyWeatherPlan>('/api/journey/weather', { journeyPlan });
  },
};
