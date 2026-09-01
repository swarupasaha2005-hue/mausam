/** Normalized personalization error codes. */
export type PersonalizationErrorCode = 'PERSONA_INVALID' | 'TIME_INVALID' | 'ACTIVITY_INVALID';

export class PersonalizationError extends Error {
  readonly code: PersonalizationErrorCode;

  constructor(code: PersonalizationErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'PersonalizationError';
    this.code = code;
  }
}
