import { useCallback, useState } from 'react';
import {
  JourneyError,
  LocationError,
  RouteError,
  type GeoPoint,
  type JourneyPlan,
  type Route,
} from '@cloud6/shared';
import { geocodingService, locationService } from '../services/location';
import { journeyService } from '../services/journey';
import { routingService } from '../services/routing';

type JourneyHookError = LocationError | RouteError | JourneyError;

interface UseJourneyState {
  start: GeoPoint | null;
  destination: GeoPoint | null;
  route: Route | null;
  journeyPlan: JourneyPlan | null;
  loading: boolean;
  error: JourneyHookError | null;
}

interface UseJourneyResult extends UseJourneyState {
  loadStart: () => Promise<void>;
  searchDestination: (query: string) => Promise<void>;
  getRoute: () => Promise<void>;
  planTimeline: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Thin orchestration hook: uses LocationService for the start point,
 * GeocodingService for destination text search, routingService for the
 * route, and journeyService for the sampled checkpoint timeline. No
 * routing-provider or sampling/timeline math lives here — that stays on
 * the backend.
 */
export function useJourney(): UseJourneyResult {
  const [start, setStart] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [journeyPlan, setJourneyPlan] = useState<JourneyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<JourneyHookError | null>(null);

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
    setJourneyPlan(null);
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
    setJourneyPlan(null);
    try {
      const result = await routingService.getRoute(start, destination);
      setRoute(result);
    } catch (cause) {
      setError(cause instanceof RouteError ? cause : new RouteError('ROUTE_PROVIDER_ERROR'));
    } finally {
      setLoading(false);
    }
  }, [start, destination]);

  const planTimeline = useCallback(async () => {
    if (!route) {
      setError(
        new JourneyError('JOURNEY_INVALID_ROUTE', 'A route is required before planning a timeline'),
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const plan = await journeyService.planJourney(route);
      setJourneyPlan(plan);
    } catch (cause) {
      setError(cause instanceof JourneyError ? cause : new JourneyError('JOURNEY_INVALID_ROUTE'));
    } finally {
      setLoading(false);
    }
  }, [route]);

  const refresh = useCallback(async () => {
    if (!destination) {
      await loadStart();
      return;
    }

    setLoading(true);
    setError(null);
    setJourneyPlan(null);
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
    journeyPlan,
    loading,
    error,
    loadStart,
    searchDestination,
    getRoute,
    planTimeline,
    refresh,
  };
}
