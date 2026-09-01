/**
 * Normalized location error codes. Provider-specific errors (Expo, native
 * GPS, geocoding APIs) must be mapped to one of these before reaching the
 * rest of the application — raw provider errors should never surface in UI.
 */
export type LocationErrorCode =
  | 'LOCATION_PERMISSION_DENIED'
  | 'LOCATION_UNAVAILABLE'
  | 'LOCATION_TIMEOUT'
  | 'LOCATION_INVALID'
  | 'GEOCODING_FAILED';

export class LocationError extends Error {
  readonly code: LocationErrorCode;

  constructor(code: LocationErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'LocationError';
    this.code = code;
  }
}
