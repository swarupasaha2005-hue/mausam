import type { GeoPoint } from '@cloud6/shared';

/** A sampled route point before a timeline is attached — no ETA yet. */
export interface SampledPoint {
  sequence: number;
  point: GeoPoint;
  distanceFromStartKm: number;
}
