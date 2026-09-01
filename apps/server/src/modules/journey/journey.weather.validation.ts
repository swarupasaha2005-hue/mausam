import { JourneyError, isValidGeoPoint, type JourneyPlan } from '@cloud6/shared';
import { assertValidRoute } from './journey.validation';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

/** Structural validation for a JourneyPlan input (reuses assertValidRoute — not reimplemented). */
export function assertValidJourneyPlan(plan: unknown): asserts plan is JourneyPlan {
  if (!plan || typeof plan !== 'object') {
    throw new JourneyError('JOURNEY_INVALID_ROUTE', 'journeyPlan is required');
  }

  const p = plan as Partial<JourneyPlan>;

  assertValidRoute(p.route);

  if (!isValidTimestamp(p.departureTime)) {
    throw new JourneyError('JOURNEY_INVALID_DEPARTURE_TIME', 'Invalid journeyPlan.departureTime');
  }

  if (!Array.isArray(p.checkpoints) || p.checkpoints.length === 0) {
    throw new JourneyError(
      'JOURNEY_INVALID_ROUTE',
      'journeyPlan.checkpoints must be a non-empty array',
    );
  }

  for (const checkpoint of p.checkpoints) {
    if (
      !checkpoint ||
      typeof checkpoint !== 'object' ||
      !isFiniteNumber(checkpoint.sequence) ||
      !isValidGeoPoint(checkpoint.point) ||
      !isFiniteNumber(checkpoint.distanceFromStartKm) ||
      !isValidTimestamp(checkpoint.estimatedArrivalTime)
    ) {
      throw new JourneyError(
        'JOURNEY_INVALID_ROUTE',
        'journeyPlan.checkpoints contains an invalid checkpoint',
      );
    }
  }
}
