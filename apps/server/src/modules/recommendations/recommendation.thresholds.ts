/**
 * Centralized, easy-to-tune thresholds for the rule engine. Prototype
 * values chosen for plausibility, not scientific/meteorological
 * validation — change these directly rather than scattering numbers
 * through recommendation.rules.ts.
 */
export const THRESHOLDS = {
  HIGH_TEMPERATURE_C: 32,
  HIGH_FEELS_LIKE_C: 35,
  HIGH_HUMIDITY_PERCENT: 75,
  HIGH_UV_INDEX: 7,
  HIGH_RAIN_PROBABILITY_PERCENT: 60,
  VERY_HIGH_RAIN_PROBABILITY_PERCENT: 80,
  HIGH_WIND_KMH: 30,
  LOW_VISIBILITY_KM: 2,
  /** US AQI: 0-50 good, 51-100 moderate, 101-150 unhealthy for sensitive groups, 151+ unhealthy. */
  HIGH_AQI: 150,
} as const;

/** WeatherCode values treated as SEVERE_WEATHER. */
export const SEVERE_WEATHER_CODES = ['thunderstorm'] as const;
