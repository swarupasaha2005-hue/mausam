import { RouteError, type GeoPoint, type Route, type RouteErrorCode } from '@cloud6/shared';
import { apiRequest, ApiHttpError, ApiInvalidResponseError, ApiRequestFailedError } from '../apiClient';

function buildQuery(start: GeoPoint, destination: GeoPoint): Record<string, string> {
  return {
    startLatitude: String(start.latitude),
    startLongitude: String(start.longitude),
    destinationLatitude: String(destination.latitude),
    destinationLongitude: String(destination.longitude),
  };
}

/**
 * Mobile-side routing client. Talks only to the CLOUD6 backend
 * (`/api/routes`) — never to OSRM directly, and never parses an OSRM
 * response.
 */
export const routingService = {
  async getRoute(start: GeoPoint, destination: GeoPoint): Promise<Route> {
    try {
      return await apiRequest<Route>('/api/routes', { query: buildQuery(start, destination) });
    } catch (cause) {
      if (cause instanceof ApiHttpError) {
        throw new RouteError(
          (cause.errorCode as RouteErrorCode) ?? 'ROUTE_PROVIDER_ERROR',
          cause.message,
        );
      }
      if (cause instanceof ApiInvalidResponseError) {
        throw new RouteError('ROUTE_INVALID_RESPONSE', cause.message);
      }
      if (cause instanceof ApiRequestFailedError) {
        throw new RouteError('ROUTE_REQUEST_FAILED', cause.message);
      }
      throw new RouteError('ROUTE_REQUEST_FAILED');
    }
  },
};
