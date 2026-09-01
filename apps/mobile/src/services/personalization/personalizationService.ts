import {
  PersonalizationError,
  type PersonalizationErrorCode,
  type UserContext,
  type UserContextInput,
} from '@cloud6/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/**
 * Mobile-side personalization client. Calls the CLOUD6 backend
 * (`/api/personalization/context`) so persona configuration stays in one
 * place — this file must not duplicate persona/weather-priority logic.
 */
export const personalizationService = {
  async createUserContext(input: UserContextInput): Promise<UserContext> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/personalization/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    } catch (cause) {
      throw new PersonalizationError(
        'PERSONA_INVALID',
        cause instanceof Error ? cause.message : 'Network request to CLOUD6 backend failed',
      );
    }

    if (!response.ok) {
      let code: PersonalizationErrorCode = 'PERSONA_INVALID';
      try {
        const body = (await response.json()) as { error?: { code?: PersonalizationErrorCode } };
        if (body?.error?.code) {
          code = body.error.code;
        }
      } catch {
        // response body wasn't JSON — fall back to the generic code above.
      }
      throw new PersonalizationError(code, `CLOUD6 backend responded with HTTP ${response.status}`);
    }

    try {
      return (await response.json()) as UserContext;
    } catch {
      throw new PersonalizationError(
        'PERSONA_INVALID',
        'CLOUD6 backend response was not valid JSON',
      );
    }
  },
};
