import { isValidGeoPoint, type GeoPoint } from '@cloud6/shared';

/**
 * Backend location logic is intentionally minimal in Phase 2: the mobile
 * app owns location acquisition. This service exists so weather/journey
 * modules have a stable place to validate coordinates once they start
 * receiving them from the mobile app.
 */
export function assertValidGeoPoint(point: GeoPoint): void {
  if (!isValidGeoPoint(point)) {
    throw new Error('Invalid coordinates');
  }
}
