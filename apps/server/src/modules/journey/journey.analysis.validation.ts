import {
  JourneyError,
  isValidGeoPoint,
  type JourneyWeatherPlan,
  type UserContext,
} from '@cloud6/shared';
import { isValidPersona } from '../personalization/persona.config';
import { assertValidRoute } from './journey.validation';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

/** Structural validation for a JourneyWeatherPlan input. Reuses assertValidRoute (not reimplemented). */
export function assertValidJourneyWeatherPlan(plan: unknown): asserts plan is JourneyWeatherPlan {
  if (!plan || typeof plan !== 'object') {
    throw new JourneyError('JOURNEY_INVALID_ROUTE', 'journeyWeatherPlan is required');
  }

  const p = plan as Partial<JourneyWeatherPlan>;

  assertValidRoute(p.route);

  if (!isValidTimestamp(p.departureTime)) {
    throw new JourneyError(
      'JOURNEY_INVALID_DEPARTURE_TIME',
      'Invalid journeyWeatherPlan.departureTime',
    );
  }

  if (!Array.isArray(p.checkpoints) || p.checkpoints.length === 0) {
    throw new JourneyError(
      'JOURNEY_INVALID_ROUTE',
      'journeyWeatherPlan.checkpoints must be a non-empty array',
    );
  }

  for (const checkpoint of p.checkpoints) {
    if (
      !checkpoint ||
      typeof checkpoint !== 'object' ||
      !isFiniteNumber(checkpoint.sequence) ||
      !checkpoint.point ||
      !isValidGeoPoint(checkpoint.point) ||
      !isFiniteNumber(checkpoint.distanceFromStartKm) ||
      !isValidTimestamp(checkpoint.estimatedArrivalTime) ||
      !('weather' in checkpoint)
    ) {
      throw new JourneyError(
        'JOURNEY_INVALID_ROUTE',
        'journeyWeatherPlan.checkpoints contains an invalid checkpoint',
      );
    }
  }
}

/** Structural validation for the UserContext input. Reuses isValidPersona (not reimplemented). */
export function assertValidUserContext(context: unknown): asserts context is UserContext {
  if (!context || typeof context !== 'object') {
    throw new JourneyError('JOURNEY_INVALID_ROUTE', 'userContext is required');
  }

  const c = context as Partial<UserContext>;

  if (!isValidPersona(c.persona)) {
    throw new JourneyError('JOURNEY_INVALID_ROUTE', `Unknown persona: ${String(c.persona)}`);
  }
  if (!Array.isArray(c.weatherPriorities)) {
    throw new JourneyError('JOURNEY_INVALID_ROUTE', 'userContext.weatherPriorities is required');
  }
}
