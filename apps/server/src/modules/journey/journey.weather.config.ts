import type { WeatherCode } from '@cloud6/shared';

/**
 * Centralized rain-detection tuning for the journey weather summary —
 * separate from (not shared with) the Recommendation Engine's
 * thresholds, since this is a distinct "did the route pass through rain"
 * concept, not a persona-relevance rule.
 */
export const JOURNEY_WEATHER_CONFIG = {
  RAIN_PROBABILITY_THRESHOLD_PERCENT: 50,
} as const;

export const RAIN_WEATHER_CODES: WeatherCode[] = ['drizzle', 'rain', 'thunderstorm'];
