import {
  RecommendationError,
  type CurrentWeather,
  type RecommendationErrorCode,
  type RecommendationResult,
  type UserContext,
} from '@cloud6/shared';
import { apiRequest, ApiHttpError, ApiInvalidResponseError, ApiRequestFailedError } from '../apiClient';

/**
 * Mobile-side recommendations client. Calls the CLOUD6 backend
 * (`/api/recommendations`) — this file must never contain recommendation
 * rules; the backend is the only source of that logic.
 */
export const recommendationsService = {
  async generate(context: UserContext, weather: CurrentWeather): Promise<RecommendationResult> {
    try {
      return await apiRequest<RecommendationResult>('/api/recommendations', {
        method: 'POST',
        body: { context, weather },
      });
    } catch (cause) {
      if (cause instanceof ApiHttpError) {
        throw new RecommendationError(
          (cause.errorCode as RecommendationErrorCode) ?? 'RECOMMENDATION_INVALID_WEATHER',
          cause.message,
        );
      }
      if (cause instanceof ApiInvalidResponseError) {
        throw new RecommendationError('RECOMMENDATION_INVALID_WEATHER', cause.message);
      }
      if (cause instanceof ApiRequestFailedError) {
        throw new RecommendationError('RECOMMENDATION_INVALID_WEATHER', cause.message);
      }
      throw new RecommendationError('RECOMMENDATION_INVALID_WEATHER');
    }
  },
};
