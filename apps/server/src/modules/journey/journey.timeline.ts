import type { JourneyCheckpoint } from '@cloud6/shared';
import type { SampledPoint } from './journey.types';

/**
 * Attaches an estimated arrival time to each sampled point, proportional
 * to distance along the route: `elapsed = (distance / totalDistance) *
 * totalDurationMinutes`. This is an ESTIMATE — it does not account for
 * traffic, road speed, or anything beyond the provider's own route
 * duration, and is not live navigation. Pure — takes an explicit
 * `departureTime` rather than reading the clock itself, so results are
 * deterministic and testable.
 */
export function calculateJourneyTimeline(
  checkpoints: SampledPoint[],
  totalDistanceKm: number,
  durationMinutes: number,
  departureTime: Date,
): JourneyCheckpoint[] {
  return checkpoints.map((checkpoint) => {
    const fraction = totalDistanceKm > 0 ? checkpoint.distanceFromStartKm / totalDistanceKm : 0;
    const elapsedMs = fraction * durationMinutes * 60 * 1000;
    const estimatedArrivalTime = new Date(departureTime.getTime() + elapsedMs).toISOString();

    return {
      sequence: checkpoint.sequence,
      point: checkpoint.point,
      distanceFromStartKm: checkpoint.distanceFromStartKm,
      estimatedArrivalTime,
    };
  });
}
