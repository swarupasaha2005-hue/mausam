import type { WeatherCode } from '@cloud6/shared';

/**
 * Lightweight condition-to-emoji mapping — avoids pulling in an icon
 * library just for decoration, while still giving each WeatherCode a
 * distinct, simple visual.
 */
const WEATHER_ICONS: Record<WeatherCode, string> = {
  clear: '☀️',
  partly_cloudy: '⛅',
  cloudy: '☁️',
  fog: '🌫️',
  drizzle: '🌦️',
  rain: '🌧️',
  snow: '❄️',
  thunderstorm: '⛈️',
  unknown: '🌡️',
};

export function weatherIcon(code: WeatherCode): string {
  return WEATHER_ICONS[code];
}

/** Display-only label for a WeatherCode — no weather logic, just UI text. */
const WEATHER_LABELS: Record<WeatherCode, string> = {
  clear: 'Clear',
  partly_cloudy: 'Partly Cloudy',
  cloudy: 'Cloudy',
  fog: 'Foggy',
  drizzle: 'Drizzle',
  rain: 'Rainy',
  snow: 'Snowy',
  thunderstorm: 'Thunderstorm',
  unknown: 'Unknown',
};

export function weatherLabel(code: WeatherCode): string {
  return WEATHER_LABELS[code];
}
