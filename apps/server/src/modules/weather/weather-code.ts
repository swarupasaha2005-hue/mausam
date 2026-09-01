import type { WeatherCode } from '@cloud6/shared';

const WEATHER_CODE_LABELS: Record<WeatherCode, string> = {
  clear: 'Clear',
  partly_cloudy: 'Partly Cloudy',
  cloudy: 'Cloudy',
  fog: 'Fog',
  drizzle: 'Drizzle',
  rain: 'Rain',
  snow: 'Snow',
  thunderstorm: 'Thunderstorm',
  unknown: 'Unknown',
};

/** Human-readable label for a normalized WeatherCode. Kept separate from any UI. */
export function getWeatherLabel(code: WeatherCode): string {
  return WEATHER_CODE_LABELS[code];
}
