/** Normalized recommendation error codes. */
export type RecommendationErrorCode =
  'RECOMMENDATION_INVALID_CONTEXT' | 'RECOMMENDATION_INVALID_WEATHER';

export class RecommendationError extends Error {
  readonly code: RecommendationErrorCode;

  constructor(code: RecommendationErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'RecommendationError';
    this.code = code;
  }
}
