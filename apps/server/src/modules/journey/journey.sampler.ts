import type { Route, SampleRouteOptions } from '@cloud6/shared';
import { JOURNEY_CONFIG } from './journey.config';
import { cumulativeDistanceKm } from './journey.distance';
import type { SampledPoint } from './journey.types';

/**
 * Reduces a route's (potentially hundreds of) coordinates to a small,
 * deterministic set of representative checkpoints, spaced by distance
 * along the route rather than by coordinate index (route coordinates are
 * not evenly spaced). Always includes the start and destination. Pure —
 * no I/O, no external calls.
 */
export function sampleRoute(route: Route, options: SampleRouteOptions = {}): SampledPoint[] {
  const coordinates = route.coordinates;
  const cumulative = cumulativeDistanceKm(coordinates);
  const totalDistanceKm = cumulative[cumulative.length - 1];
  const lastIndex = coordinates.length - 1;

  const maxCheckpoints = Math.max(2, options.maxCheckpoints ?? JOURNEY_CONFIG.MAX_CHECKPOINTS);
  const requestedInterval = Math.max(
    options.intervalKm ?? JOURNEY_CONFIG.DEFAULT_SAMPLE_INTERVAL_KM,
    JOURNEY_CONFIG.MIN_SAMPLE_INTERVAL_KM,
  );

  // Short route (or a single coordinate): just start + destination.
  if (totalDistanceKm <= requestedInterval || lastIndex === 0) {
    return dedupeConsecutive([
      { point: coordinates[0], distanceFromStartKm: 0 },
      { point: coordinates[lastIndex], distanceFromStartKm: totalDistanceKm },
    ]).map((p, i) => ({ ...p, sequence: i + 1 }));
  }

  // Cap checkpoint count by widening the interval, rather than truncating.
  const pointCountAtRequestedInterval = Math.floor(totalDistanceKm / requestedInterval) + 2;
  const effectiveInterval =
    pointCountAtRequestedInterval > maxCheckpoints
      ? totalDistanceKm / (maxCheckpoints - 1)
      : requestedInterval;

  const stepCount = Math.min(Math.ceil(totalDistanceKm / effectiveInterval), maxCheckpoints - 1);
  const targets: number[] = [];
  for (let i = 0; i <= stepCount; i += 1) {
    targets.push(Math.min((i * totalDistanceKm) / stepCount, totalDistanceKm));
  }

  const sampled = targets.map((targetKm) => ({
    point: coordinates[nearestIndex(cumulative, targetKm)],
    distanceFromStartKm: targetKm,
  }));

  return dedupeConsecutive(sampled).map((p, i) => ({ ...p, sequence: i + 1 }));
}

function nearestIndex(cumulative: number[], targetKm: number): number {
  let bestIndex = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < cumulative.length; i += 1) {
    const diff = Math.abs(cumulative[i] - targetKm);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function dedupeConsecutive(
  points: { point: { latitude: number; longitude: number }; distanceFromStartKm: number }[],
): { point: { latitude: number; longitude: number }; distanceFromStartKm: number }[] {
  return points.filter(
    (p, i) => i === 0 || p.distanceFromStartKm !== points[i - 1].distanceFromStartKm,
  );
}
