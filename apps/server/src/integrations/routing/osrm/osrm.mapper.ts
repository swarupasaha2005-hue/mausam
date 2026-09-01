import { RouteError, type GeoPoint, type Route } from '@cloud6/shared';
import type { OsrmRouteResponse } from './osrm.types';

const METERS_PER_KM = 1000;
const SECONDS_PER_MINUTE = 60;

/** Maps an OSRM route response into CLOUD6's normalized Route model. */
export function mapOsrmRoute(
  response: OsrmRouteResponse,
  start: GeoPoint,
  destination: GeoPoint,
): Route {
  if (response.code !== 'Ok') {
    throw new RouteError(
      'ROUTE_NOT_FOUND',
      response.message ?? `OSRM returned code: ${response.code}`,
    );
  }

  const route = response.routes?.[0];
  if (!route) {
    throw new RouteError('ROUTE_NOT_FOUND', 'OSRM returned no routes');
  }

  if (typeof route.distance !== 'number' || typeof route.duration !== 'number') {
    throw new RouteError('ROUTE_INVALID_RESPONSE', 'OSRM route is missing distance/duration');
  }

  const rawCoordinates = route.geometry?.coordinates;
  if (!Array.isArray(rawCoordinates) || rawCoordinates.length === 0) {
    throw new RouteError('ROUTE_INVALID_RESPONSE', 'OSRM route is missing geometry');
  }

  const coordinates: GeoPoint[] = rawCoordinates.map(([longitude, latitude]) => ({
    latitude,
    longitude,
  }));

  return {
    start,
    destination,
    distanceKm: route.distance / METERS_PER_KM,
    durationMinutes: route.duration / SECONDS_PER_MINUTE,
    coordinates,
  };
}
