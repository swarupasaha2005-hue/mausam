import { useCallback, useState } from 'react';
import { LocationError, RouteError, type GeoPoint, type Route } from '@cloud6/shared';
import { geocodingService, locationService } from '../services/location';
import { routingService } from '../services/routing';

interface UseJourneyState {
  start: GeoPoint | null;
  destination: GeoPoint | null;
  route: Route | null;
  loading: boolean;
  error: LocationError | RouteError | null;
}

interface UseJourneyResult extends UseJourneyState {
  loadStart: () => Promise<void>;
  searchDestination: (query: string) => Promise<void>;
  getRoute: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Thin orchestration hook: uses LocationService for the start point,
 * GeocodingService for destination text search, and routingService for
 * the route itself. No OSRM-specific or routing-provider logic lives
 * here — that stays in the backend RoutingService.
 */
export function useJourney(): UseJourneyResult {
  const [start, setStart] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LocationError | RouteError | null>(null);

  const loadStart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const point = await locationService.getCurrentLocation();
      setStart(point);
    } catch (cause) {
      setError(cause instanceof LocationError ? cause : new LocationError('LOCATION_UNAVAILABLE'));
    } finally {
      setLoading(false);
    }
  }, []);

  const searchDestination = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setRoute(null);
    try {
      const [point] = await geocodingService.geocode(query);
      if (!point) {
        setError(new LocationError('GEOCODING_FAILED', `No results for "${query}"`));
        return;
      }
      setDestination(point);
    } catch (cause) {
      setError(cause instanceof LocationError ? cause : new LocationError('GEOCODING_FAILED'));
    } finally {
      setLoading(false);
    }
  }, []);

  const getRoute = useCallback(async () => {
    if (!start || !destination) {
      setError(new RouteError('ROUTE_INVALID_COORDINATES', 'Start and destination are required'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await routingService.getRoute(start, destination);
      setRoute(result);
    } catch (cause) {
      setError(cause instanceof RouteError ? cause : new RouteError('ROUTE_PROVIDER_ERROR'));
    } finally {
      setLoading(false);
    }
  }, [start, destination]);

  const refresh = useCallback(async () => {
    if (!destination) {
      await loadStart();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const point = await locationService.getCurrentLocation();
      setStart(point);
      const result = await routingService.getRoute(point, destination);
      setRoute(result);
    } catch (cause) {
      setError(
        cause instanceof LocationError || cause instanceof RouteError
          ? cause
          : new RouteError('ROUTE_PROVIDER_ERROR'),
      );
    } finally {
      setLoading(false);
    }
  }, [destination]);

  return {
    start,
    destination,
    route,
    loading,
    error,
    loadStart,
    searchDestination,
    getRoute,
    refresh,
  };
}
