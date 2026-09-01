import { RouteError, type GeoPoint } from '@cloud6/shared';
import { env } from '../../../config/env';
import type { OsrmRouteResponse } from './osrm.types';

function buildRouteUrl(start: GeoPoint, destination: GeoPoint): string {
  const coords = `${start.longitude},${start.latitude};${destination.longitude},${destination.latitude}`;
  const params = new URLSearchParams({ overview: 'full', geometries: 'geojson' });
  return `${env.osrmBaseUrl}/route/v1/driving/${coords}?${params.toString()}`;
}

/** Fetches a driving route between two points from OSRM. */
export async function fetchOsrmRoute(
  start: GeoPoint,
  destination: GeoPoint,
): Promise<OsrmRouteResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.routingRequestTimeoutMs);

  let response: Response;
  try {
    response = await fetch(buildRouteUrl(start, destination), { signal: controller.signal });
  } catch (cause) {
    if (cause instanceof Error && cause.name === 'AbortError') {
      throw new RouteError('ROUTE_TIMEOUT', 'OSRM request timed out');
    }
    throw new RouteError(
      'ROUTE_REQUEST_FAILED',
      cause instanceof Error ? cause.message : 'Network request to OSRM failed',
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new RouteError('ROUTE_PROVIDER_ERROR', `OSRM responded with HTTP ${response.status}`);
  }

  try {
    return (await response.json()) as OsrmRouteResponse;
  } catch {
    throw new RouteError('ROUTE_INVALID_RESPONSE', 'OSRM response was not valid JSON');
  }
}
