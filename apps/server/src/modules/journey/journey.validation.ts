import { JourneyError, isValidGeoPoint, type Route } from '@cloud6/shared';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Structural + range validation for the Route input to journey planning. */
export function assertValidRoute(route: unknown): asserts route is Route {
  if (!route || typeof route !== 'object') {
    throw new JourneyError('JOURNEY_INVALID_ROUTE', 'route is required');
  }

  const r = route as Partial<Route>;

  if (!r.start || !isValidGeoPoint(r.start)) {
    throw new JourneyError('JOURNEY_INVALID_ROUTE', 'Invalid route.start');
  }
  if (!r.destination || !isValidGeoPoint(r.destination)) {
    throw new JourneyError('JOURNEY_INVALID_ROUTE', 'Invalid route.destination');
  }
  if (!isFiniteNumber(r.distanceKm) || r.distanceKm < 0) {
    throw new JourneyError('JOURNEY_INVALID_ROUTE', 'Invalid route.distanceKm');
  }
  if (!isFiniteNumber(r.durationMinutes) || r.durationMinutes < 0) {
    throw new JourneyError('JOURNEY_INVALID_ROUTE', 'Invalid route.durationMinutes');
  }
  if (!Array.isArray(r.coordinates) || r.coordinates.length === 0) {
    throw new JourneyError('JOURNEY_INVALID_ROUTE', 'route.coordinates must be a non-empty array');
  }
  for (const point of r.coordinates) {
    if (!isValidGeoPoint(point)) {
      throw new JourneyError(
        'JOURNEY_INVALID_ROUTE',
        'route.coordinates contains an invalid point',
      );
    }
  }
}

/** Parses and validates an optional departureTime, defaulting to `fallback`. */
export function parseDepartureTime(value: unknown, fallback: Date): Date {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value !== 'string') {
    throw new JourneyError('JOURNEY_INVALID_DEPARTURE_TIME', 'departureTime must be an ISO string');
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new JourneyError('JOURNEY_INVALID_DEPARTURE_TIME', `Invalid departureTime: ${value}`);
  }
  return parsed;
}

/** Validates optional sampling options. */
export function assertValidOptions(
  options: unknown,
): asserts options is { intervalKm?: number; maxCheckpoints?: number } | undefined {
  if (options === undefined || options === null) {
    return;
  }
  if (typeof options !== 'object') {
    throw new JourneyError('JOURNEY_INVALID_OPTIONS', 'options must be an object');
  }
  const o = options as { intervalKm?: unknown; maxCheckpoints?: unknown };
  if (o.intervalKm !== undefined && (!isFiniteNumber(o.intervalKm) || o.intervalKm <= 0)) {
    throw new JourneyError('JOURNEY_INVALID_OPTIONS', 'Invalid options.intervalKm');
  }
  if (
    o.maxCheckpoints !== undefined &&
    (!isFiniteNumber(o.maxCheckpoints) || o.maxCheckpoints < 2)
  ) {
    throw new JourneyError('JOURNEY_INVALID_OPTIONS', 'Invalid options.maxCheckpoints');
  }
}
