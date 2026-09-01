/**
 * Normalized weather error codes. Provider-specific errors (HTTP status,
 * network failure, malformed JSON, etc.) must be mapped to one of these
 * before reaching the mobile application — raw provider errors should
 * never surface in UI.
 */
export type WeatherErrorCode =
  | 'WEATHER_PROVIDER_ERROR'
  | 'WEATHER_REQUEST_FAILED'
  | 'WEATHER_INVALID_RESPONSE'
  | 'WEATHER_INVALID_COORDINATES'
  | 'WEATHER_TIMEOUT'
  | 'WEATHER_RATE_LIMITED';

export class WeatherError extends Error {
  readonly code: WeatherErrorCode;

  constructor(code: WeatherErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'WeatherError';
    this.code = code;
  }
}
