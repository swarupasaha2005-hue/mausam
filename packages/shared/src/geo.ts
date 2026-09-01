/**
 * A single geographic coordinate. This is the only shared domain type
 * established in Phase 1 — weather and journey models will be designed
 * carefully in their respective phases.
 */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/** Latitude must fall within this range for a GeoPoint to be valid. */
export const MIN_LATITUDE = -90;
export const MAX_LATITUDE = 90;

/** Longitude must fall within this range for a GeoPoint to be valid. */
export const MIN_LONGITUDE = -180;
export const MAX_LONGITUDE = 180;

export function isValidGeoPoint(point: GeoPoint): boolean {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= MIN_LATITUDE &&
    point.latitude <= MAX_LATITUDE &&
    point.longitude >= MIN_LONGITUDE &&
    point.longitude <= MAX_LONGITUDE
  );
}
