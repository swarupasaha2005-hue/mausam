import { RouteError, isValidGeoPoint, type GeoPoint, type Route } from '@cloud6/shared';
import { osrmRoutingProvider } from '../../integrations/routing/osrm/osrm.provider';
import { toRouteError } from './routing.errors';
import type { RoutingProvider } from './routing.types';

function assertValidPoint(point: GeoPoint): void {
  if (!isValidGeoPoint(point)) {
    throw new RouteError('ROUTE_INVALID_COORDINATES', 'Invalid latitude/longitude');
  }
}

/**
 * Application-facing routing interface. Depends on RoutingProvider, never
 * on OSRM directly.
 */
export class RoutingService {
  constructor(private readonly provider: RoutingProvider = osrmRoutingProvider) {}

  async getRoute(start: GeoPoint, destination: GeoPoint): Promise<Route> {
    assertValidPoint(start);
    assertValidPoint(destination);

    try {
      return await this.provider.getRoute(start, destination);
    } catch (cause) {
      throw toRouteError(cause);
    }
  }
}

export const routingService = new RoutingService();
