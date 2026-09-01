import {
  JourneyError,
  type JourneyErrorCode,
  type JourneyPlan,
  type Route,
  type SampleRouteOptions,
} from '@cloud6/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/**
 * Mobile-side journey-planning client. Calls the CLOUD6 backend
 * (`/api/journey/plan`) — route sampling and timeline math stay on the
 * backend; this file contains none of that logic.
 */
export const journeyService = {
  async planJourney(
    route: Route,
    departureTime?: string,
    options?: SampleRouteOptions,
  ): Promise<JourneyPlan> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/journey/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route, departureTime, options }),
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
        const body = (await response.json()) as { error?: { code?: JourneyErrorCode } };
        if (body?.error?.code) {
          code = body.error.code;
        }
      } catch {
        // response body wasn't JSON — fall back to the generic code above.
      }
      throw new JourneyError(code, `CLOUD6 backend responded with HTTP ${response.status}`);
    }

    try {
      return (await response.json()) as JourneyPlan;
    } catch {
      throw new JourneyError('JOURNEY_INVALID_ROUTE', 'CLOUD6 backend response was not valid JSON');
    }
  },
};
