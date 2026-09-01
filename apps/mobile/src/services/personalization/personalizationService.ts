import {
  PersonalizationError,
  type PersonalizationErrorCode,
  type UserContext,
  type UserContextInput,
} from '@cloud6/shared';
import { apiRequest, ApiHttpError, ApiInvalidResponseError, ApiRequestFailedError } from '../apiClient';

/**
 * Mobile-side personalization client. Calls the CLOUD6 backend
 * (`/api/personalization/context`) so persona configuration stays in one
 * place — this file must not duplicate persona/weather-priority logic.
 */
export const personalizationService = {
  async createUserContext(input: UserContextInput): Promise<UserContext> {
    try {
      return await apiRequest<UserContext>('/api/personalization/context', {
        method: 'POST',
        body: input,
      });
    } catch (cause) {
      if (cause instanceof ApiHttpError) {
        throw new PersonalizationError(
          (cause.errorCode as PersonalizationErrorCode) ?? 'PERSONA_INVALID',
          cause.message,
        );
      }
      if (cause instanceof ApiInvalidResponseError) {
        throw new PersonalizationError('PERSONA_INVALID', cause.message);
      }
      if (cause instanceof ApiRequestFailedError) {
        throw new PersonalizationError('PERSONA_INVALID', cause.message);
      }
      throw new PersonalizationError('PERSONA_INVALID');
    }
  },
};
