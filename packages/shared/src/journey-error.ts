/** Normalized journey-planning error codes. */
export type JourneyErrorCode =
  'JOURNEY_INVALID_ROUTE' | 'JOURNEY_INVALID_DEPARTURE_TIME' | 'JOURNEY_INVALID_OPTIONS';

export class JourneyError extends Error {
  readonly code: JourneyErrorCode;

  constructor(code: JourneyErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'JourneyError';
    this.code = code;
  }
}
