import {
  RecommendationError,
  type CurrentWeather,
  type RecommendationErrorCode,
  type RecommendationResult,
  type UserContext,
} from '@cloud6/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/**
 * Mobile-side recommendations client. Calls the CLOUD6 backend
 * (`/api/recommendations`) — this file must never contain recommendation
 * rules; the backend is the only source of that logic.
 */
export const recommendationsService = {
  async generate(context: UserContext, weather: CurrentWeather): Promise<RecommendationResult> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, weather }),
      });
    } catch (cause) {
      throw new RecommendationError(
        'RECOMMENDATION_INVALID_WEATHER',
        cause instanceof Error ? cause.message : 'Network request to CLOUD6 backend failed',
      );
    }

    if (!response.ok) {
      let code: RecommendationErrorCode = 'RECOMMENDATION_INVALID_WEATHER';
      try {
        const body = (await response.json()) as { error?: { code?: RecommendationErrorCode } };
        if (body?.error?.code) {
          code = body.error.code;
        }
      } catch {
        // response body wasn't JSON — fall back to the generic code above.
      }
      throw new RecommendationError(code, `CLOUD6 backend responded with HTTP ${response.status}`);
    }

    try {
      return (await response.json()) as RecommendationResult;
    } catch {
      throw new RecommendationError(
        'RECOMMENDATION_INVALID_WEATHER',
        'CLOUD6 backend response was not valid JSON',
      );
    }
  },
};
