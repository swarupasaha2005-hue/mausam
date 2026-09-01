import type { HourlyWeather, JourneyFactor } from '@cloud6/shared';
import { SEVERE_WEATHER_CODES, THRESHOLDS } from '../recommendations/recommendation.thresholds';

/**
 * Point-in-time factors for a single checkpoint's weather. Reuses Phase
 * 5's thresholds directly (imported, not copied) — this is a separate
 * function (not `recommendations/recommendation.rules.ts`'s
 * `evaluateFactors`) only because journey checkpoints carry `HourlyWeather`
 * (no `feelsLike`/`visibility`), not `CurrentWeather`.
 */
export function evaluateCheckpointFactors(weather: HourlyWeather): JourneyFactor[] {
  const factors: JourneyFactor[] = [];

  if (weather.rainProbability >= THRESHOLDS.VERY_HIGH_RAIN_PROBABILITY_PERCENT) {
    factors.push('HEAVY_RAIN_DURING_JOURNEY');
  } else if (weather.rainProbability >= THRESHOLDS.HIGH_RAIN_PROBABILITY_PERCENT) {
    factors.push('RAIN_DURING_JOURNEY');
  }

  if ((SEVERE_WEATHER_CODES as readonly string[]).includes(weather.weatherCode)) {
    factors.push('THUNDERSTORM_DURING_JOURNEY');
  }

  if (weather.windSpeed >= THRESHOLDS.HIGH_WIND_KMH) {
    factors.push('HIGH_WIND_DURING_JOURNEY');
  }

  if (weather.temperature >= THRESHOLDS.HIGH_TEMPERATURE_C) {
    factors.push('HIGH_HEAT_DURING_JOURNEY');
  }

  if (weather.uvIndex >= THRESHOLDS.HIGH_UV_INDEX) {
    factors.push('HIGH_UV_DURING_JOURNEY');
  }

  return factors;
}

/** Coarse severity ranking used only to detect deterioration across a journey — not a risk score. */
const WEATHER_CODE_SEVERITY: Record<HourlyWeather['weatherCode'], number> = {
  clear: 0,
  partly_cloudy: 1,
  cloudy: 1,
  fog: 2,
  drizzle: 2,
  rain: 3,
  snow: 3,
  thunderstorm: 4,
  unknown: 0,
};

export function weatherCodeSeverity(code: HourlyWeather['weatherCode']): number {
  return WEATHER_CODE_SEVERITY[code];
}
