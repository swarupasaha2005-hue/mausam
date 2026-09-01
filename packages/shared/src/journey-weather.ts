import type { HourlyWeather, WeatherCode } from './weather';
import type { WeatherErrorCode } from './weather-error';
import type { GeoPoint } from './geo';
import type { Route } from './route';

/** A journey checkpoint enriched with weather at its estimated arrival time. */
export interface JourneyWeatherCheckpoint {
  sequence: number;
  point: GeoPoint;
  distanceFromStartKm: number;
  /** ISO 8601 timestamp. */
  estimatedArrivalTime: string;
  /** Null when this checkpoint's weather lookup failed — see `weatherError`. */
  weather: HourlyWeather | null;
  weatherError?: { code: WeatherErrorCode; message: string };
}

/** A detected change in weather condition between two consecutive checkpoints. */
export interface JourneyWeatherTransition {
  fromSequence: number;
  toSequence: number;
  fromCondition: WeatherCode;
  toCondition: WeatherCode;
}

/**
 * Simple derived overview of the journey's weather — not a risk score,
 * not a recommendation. Helps the UI understand what happened along the
 * route without re-scanning every checkpoint itself.
 */
export interface JourneyWeatherSummary {
  weatherAvailableCheckpoints: number;
  weatherUnavailableCheckpoints: number;
  rainAffectedCheckpointCount: number;
  firstRainCheckpointSequence: number | null;
  transitions: JourneyWeatherTransition[];
}

/** A JourneyPlan (Phase 8) with weather attached at each checkpoint. */
export interface JourneyWeatherPlan {
  route: Route;
  departureTime: string;
  estimatedArrivalTime: string;
  durationMinutes: number;
  checkpoints: JourneyWeatherCheckpoint[];
  summary: JourneyWeatherSummary;
}
