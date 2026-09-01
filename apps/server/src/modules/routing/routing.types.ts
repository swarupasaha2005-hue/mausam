import type { GeoPoint, Route } from '@cloud6/shared';

/**
 * Port the routing module depends on. `OsrmRoutingProvider` is the only
 * adapter today, but nothing here is OSRM-specific — swapping providers
 * later means writing a new adapter, not touching RoutingService or
 * anything that consumes it.
 */
export interface RoutingProvider {
  getRoute(start: GeoPoint, destination: GeoPoint): Promise<Route>;
}
