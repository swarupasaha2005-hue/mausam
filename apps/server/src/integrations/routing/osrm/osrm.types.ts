/**
 * Raw OSRM /route response shapes (geometries=geojson). Only the fields
 * CLOUD6 actually reads are declared. Must never leak past
 * osrm.mapper.ts.
 */
export interface OsrmGeometry {
  type: 'LineString';
  /** [longitude, latitude] pairs — OSRM/GeoJSON order, opposite of GeoPoint. */
  coordinates: [number, number][];
}

export interface OsrmRoute {
  distance: number; // meters
  duration: number; // seconds
  geometry: OsrmGeometry;
}

export interface OsrmRouteResponse {
  code: string;
  message?: string;
  routes?: OsrmRoute[];
}
