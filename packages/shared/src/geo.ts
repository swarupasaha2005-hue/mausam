/**
 * A single geographic coordinate. This is the only shared domain type
 * established in Phase 1 — weather and journey models will be designed
 * carefully in their respective phases.
 */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}
