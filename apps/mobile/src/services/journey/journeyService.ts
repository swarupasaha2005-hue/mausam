import {
  JourneyError,
  type JourneyErrorCode,
  type JourneyIntelligence,
  type JourneyPlan,
  type JourneyWeatherPlan,
  type Route,
  type SampleRouteOptions,
  type UserContext,
} from '@cloud6/shared';
import { apiRequest, ApiHttpError, ApiInvalidResponseError, ApiRequestFailedError } from '../apiClient';

async function postJson<T>(path: string, body: unknown): Promise<T> {
  try {
    return await apiRequest<T>(path, { method: 'POST', body });
  } catch (cause) {
    if (cause instanceof ApiHttpError) {
      throw new JourneyError(
        (cause.errorCode as JourneyErrorCode) ?? 'JOURNEY_INVALID_ROUTE',
        cause.message,
      );
    }
    if (cause instanceof ApiInvalidResponseError) {
      throw new JourneyError('JOURNEY_INVALID_ROUTE', cause.message);
    }
    if (cause instanceof ApiRequestFailedError) {
      throw new JourneyError('JOURNEY_INVALID_ROUTE', cause.message);
    }
    throw new JourneyError('JOURNEY_INVALID_ROUTE');
  }
}

/**
 * Mobile-side journey client. Calls the CLOUD6 backend
 * (`/api/journey/plan`, `/api/journey/weather`, `/api/journey/intelligence`)
 * — route sampling, timeline math, weather enrichment, and journey risk/
 * recommendation rules all stay on the backend; this file contains none
 * of that logic and never calls Open-Meteo.
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

  getJourneyIntelligence(
    journeyWeatherPlan: JourneyWeatherPlan,
    userContext: UserContext,
  ): Promise<JourneyIntelligence> {
    return postJson<JourneyIntelligence>('/api/journey/intelligence', {
      journeyWeatherPlan,
      userContext,
    });
  },
};
