import { RouteError, type GeoPoint, type Route, type RouteErrorCode } from '@cloud6/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

function buildQuery(start: GeoPoint, destination: GeoPoint): string {
  const params = new URLSearchParams({
    startLatitude: String(start.latitude),
    startLongitude: String(start.longitude),
    destinationLatitude: String(destination.latitude),
    destinationLongitude: String(destination.longitude),
  });
  return params.toString();
}

/**
 * Mobile-side routing client. Talks only to the CLOUD6 backend
 * (`/api/routes`) — never to OSRM directly, and never parses an OSRM
 * response.
 */
export const routingService = {
  async getRoute(start: GeoPoint, destination: GeoPoint): Promise<Route> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/routes?${buildQuery(start, destination)}`);
    } catch (cause) {
      throw new RouteError(
        'ROUTE_REQUEST_FAILED',
        cause instanceof Error ? cause.message : 'Network request to CLOUD6 backend failed',
      );
    }

    if (!response.ok) {
      let code: RouteErrorCode = 'ROUTE_PROVIDER_ERROR';
      try {
        const body = (await response.json()) as { error?: { code?: RouteErrorCode } };
        if (body?.error?.code) {
          code = body.error.code;
        }
      } catch {
        // response body wasn't JSON — fall back to the generic code above.
      }
      throw new RouteError(code, `CLOUD6 backend responded with HTTP ${response.status}`);
    }

    try {
      return (await response.json()) as Route;
    } catch {
      throw new RouteError('ROUTE_INVALID_RESPONSE', 'CLOUD6 backend response was not valid JSON');
    }
  },
};
