import type { GeoPoint, Route } from '@cloud6/shared';
import type { RoutingProvider } from '../../../modules/routing/routing.types';
import { fetchOsrmRoute } from './osrm.client';
import { mapOsrmRoute } from './osrm.mapper';

/** RoutingProvider backed by the public OSRM demo server. */
export const osrmRoutingProvider: RoutingProvider = {
  async getRoute(start: GeoPoint, destination: GeoPoint): Promise<Route> {
    const response = await fetchOsrmRoute(start, destination);
    return mapOsrmRoute(response, start, destination);
  },
};
