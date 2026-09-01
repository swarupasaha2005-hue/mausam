import type { GeoPoint } from '@cloud6/shared';

/**
 * Data MapView needs to visualize a route — purely presentational. The
 * component knows nothing about how this data was obtained (routingService,
 * OSRM, etc.) and issues no requests itself.
 */
export interface MapViewProps {
  start: GeoPoint | null;
  destination: GeoPoint | null;
  routeCoordinates: GeoPoint[];
}
