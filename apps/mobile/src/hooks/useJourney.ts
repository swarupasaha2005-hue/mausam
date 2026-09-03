import { useCallback, useState } from 'react';
import {
  JourneyError,
  LocationError,
  PersonalizationError,
  RouteError,
  type GeoPoint,
  type JourneyIntelligence,
  type JourneyPlan,
  type JourneyWeatherPlan,
  type Persona,
  type Route,
  type TimeOfDay,
} from '@cloud6/shared';
import { geocodingService, locationService } from '../services/location';
import { journeyService } from '../services/journey';
import { personalizationService } from '../services/personalization';
import { routingService } from '../services/routing';

type JourneyHookError = LocationError | RouteError | JourneyError | PersonalizationError;

interface UseJourneyState {
  start: GeoPoint | null;
  destination: GeoPoint | null;
  route: Route | null;
  journeyPlan: JourneyPlan | null;
  journeyWeather: JourneyWeatherPlan | null;
  journeyIntelligence: JourneyIntelligence | null;
  persona: Persona;
  preferredTimeOfDay: TimeOfDay;
  loading: boolean;
  error: JourneyHookError | null;
}

interface UseJourneyResult extends UseJourneyState {
  loadStart: () => Promise<void>;
  searchDestination: (query: string) => Promise<void>;
  selectDestination: (point: GeoPoint) => void;
  getRoute: () => Promise<void>;
  planTimeline: () => Promise<void>;
  analyzeWeather: () => Promise<void>;
  analyzeJourney: () => Promise<void>;
  setPersona: (persona: Persona) => void;
  setPreferredTimeOfDay: (time: TimeOfDay) => void;
  refresh: () => Promise<void>;
}

const DEFAULT_PERSONA: Persona = 'runner';
const DEFAULT_TIME: TimeOfDay = 'flexible';

function devLog(...args: unknown[]): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[Cloud6 Journey]', ...args);
  }
}

/**
 * Thin orchestration hook: uses LocationService for the start point,
 * GeocodingService for destination text search, routingService for the
 * route, and journeyService for the sampled checkpoint timeline, weather
 * enrichment, and journey intelligence. No routing-provider, sampling/
 * timeline, weather, or journey-risk logic lives here — that all stays
 * on the backend.
 */
export function useJourney(): UseJourneyResult {
  const [start, setStart] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [journeyPlan, setJourneyPlan] = useState<JourneyPlan | null>(null);
  const [journeyWeather, setJourneyWeather] = useState<JourneyWeatherPlan | null>(null);
  const [journeyIntelligence, setJourneyIntelligence] = useState<JourneyIntelligence | null>(null);
  const [persona, setPersonaState] = useState<Persona>(DEFAULT_PERSONA);
  const [preferredTimeOfDay, setPreferredTimeOfDayState] = useState<TimeOfDay>(DEFAULT_TIME);
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
    setJourneyWeather(null);
    setJourneyIntelligence(null);
    devLog('geocoding destination:', query);
    try {
      const [point] = await geocodingService.geocode(query);
      devLog('geocoding result:', point ?? 'no results');
      if (!point) {
        setError(new LocationError('GEOCODING_FAILED', `No results for "${query}"`));
        return;
      }
      setDestination(point);
    } catch (cause) {
      devLog('geocoding error:', cause);
      setError(cause instanceof LocationError ? cause : new LocationError('GEOCODING_FAILED'));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sets an explicitly user-selected destination point (e.g. from a
   * multi-result search UI), as opposed to searchDestination's
   * auto-selected first match. Additive to the existing flow — resets
   * downstream state the same way searchDestination does.
   */
  const selectDestination = useCallback((point: GeoPoint) => {
    setDestination(point);
    setRoute(null);
    setJourneyPlan(null);
    setJourneyWeather(null);
    setJourneyIntelligence(null);
    setError(null);
  }, []);

  const getRoute = useCallback(async () => {
    if (!start || !destination) {
      setError(new RouteError('ROUTE_INVALID_COORDINATES', 'Start and destination are required'));
      return;
    }

    setLoading(true);
    setError(null);
    setJourneyPlan(null);
    setJourneyWeather(null);
    setJourneyIntelligence(null);
    devLog('route request:', start, '->', destination);
    try {
      const result = await routingService.getRoute(start, destination);
      devLog('route result: distanceKm=', result.distanceKm, 'durationMinutes=', result.durationMinutes);
      setRoute(result);
    } catch (cause) {
      devLog('route error:', cause);
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
    setJourneyWeather(null);
    setJourneyIntelligence(null);
    devLog('journey plan request');
    try {
      const plan = await journeyService.planJourney(route);
      devLog('journey plan result: checkpoint count=', plan.checkpoints.length);
      setJourneyPlan(plan);
    } catch (cause) {
      devLog('journey plan error:', cause);
      setError(cause instanceof JourneyError ? cause : new JourneyError('JOURNEY_INVALID_ROUTE'));
    } finally {
      setLoading(false);
    }
  }, [route]);

  const analyzeWeather = useCallback(async () => {
    if (!journeyPlan) {
      setError(
        new JourneyError(
          'JOURNEY_INVALID_ROUTE',
          'A journey timeline is required before analyzing weather',
        ),
      );
      return;
    }

    setLoading(true);
    setError(null);
    setJourneyIntelligence(null);
    devLog('weather request for', journeyPlan.checkpoints.length, 'checkpoints');
    try {
      const weatherPlan = await journeyService.getJourneyWeather(journeyPlan);
      devLog(
        'weather result: available=',
        weatherPlan.summary.weatherAvailableCheckpoints,
        'unavailable=',
        weatherPlan.summary.weatherUnavailableCheckpoints,
      );
      setJourneyWeather(weatherPlan);
    } catch (cause) {
      devLog('weather error:', cause);
      setError(cause instanceof JourneyError ? cause : new JourneyError('JOURNEY_INVALID_ROUTE'));
    } finally {
      setLoading(false);
    }
  }, [journeyPlan]);

  /**
   * Regenerates journey intelligence from the already-fetched
   * journeyWeather — never re-fetches location/route/weather. This is
   * what makes persona switching cheap (same principle as Phase 6).
   */
  const analyzeJourney = useCallback(async () => {
    if (!journeyWeather) {
      setError(
        new JourneyError(
          'JOURNEY_INVALID_ROUTE',
          'Journey weather is required before generating intelligence',
        ),
      );
      return;
    }

    setLoading(true);
    setError(null);
    devLog('intelligence request: persona=', persona, 'preferredTimeOfDay=', preferredTimeOfDay);
    try {
      const context = await personalizationService.createUserContext({
        persona,
        preferredTimeOfDay,
      });
      const intelligence = await journeyService.getJourneyIntelligence(journeyWeather, context);
      devLog(
        'intelligence result: riskLevel=',
        intelligence.analysis.riskLevel,
        'recommendation=',
        intelligence.recommendation?.title,
      );
      setJourneyIntelligence(intelligence);
    } catch (cause) {
      devLog('intelligence error:', cause);
      setError(
        cause instanceof JourneyError || cause instanceof PersonalizationError
          ? cause
          : new JourneyError('JOURNEY_INVALID_ROUTE'),
      );
    } finally {
      setLoading(false);
    }
  }, [journeyWeather, persona, preferredTimeOfDay]);

  const setPersona = useCallback((nextPersona: Persona) => {
    setPersonaState(nextPersona);
  }, []);

  const setPreferredTimeOfDay = useCallback((nextTime: TimeOfDay) => {
    setPreferredTimeOfDayState(nextTime);
  }, []);

  const refresh = useCallback(async () => {
    if (!destination) {
      await loadStart();
      return;
    }

    setLoading(true);
    setError(null);
    setJourneyPlan(null);
    setJourneyWeather(null);
    setJourneyIntelligence(null);
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
    journeyWeather,
    journeyIntelligence,
    persona,
    preferredTimeOfDay,
    loading,
    error,
    loadStart,
    searchDestination,
    selectDestination,
    getRoute,
    planTimeline,
    analyzeWeather,
    analyzeJourney,
    setPersona,
    setPreferredTimeOfDay,
    refresh,
  };
}
