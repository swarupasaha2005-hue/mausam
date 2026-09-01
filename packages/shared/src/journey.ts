import type { GeoPoint } from './geo';
import type { Route } from './route';

/**
 * A representative point along a route, with an estimated arrival time.
 * `estimatedArrivalTime` is a proportional estimate derived from route
 * distance and provider-estimated duration — it does not account for
 * traffic and is not live navigation. Deliberately excludes weather:
 * a future Journey Weather Engine will look up
 * `WeatherService.getWeatherAt(point, estimatedArrivalTime)` using this
 * checkpoint, not have weather embedded in it.
 */
export interface JourneyCheckpoint {
  sequence: number;
  point: GeoPoint;
  distanceFromStartKm: number;
  /** ISO 8601 timestamp. */
  estimatedArrivalTime: string;
}

/**
 * A route reduced to a small number of timestamped checkpoints — the
 * input a future Journey Weather Engine will consume. Purely
 * geographic/time data; no weather, persona, or recommendation fields.
 */
export interface JourneyPlan {
  route: Route;
  /** ISO 8601 timestamp. */
  departureTime: string;
  /** ISO 8601 timestamp — estimated arrival at the destination. */
  estimatedArrivalTime: string;
  durationMinutes: number;
  checkpoints: JourneyCheckpoint[];
}

/** Tunable route-sampling behavior. See journey.config.ts for defaults. */
export interface SampleRouteOptions {
  intervalKm?: number;
  maxCheckpoints?: number;
}
