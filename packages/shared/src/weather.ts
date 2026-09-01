import type { GeoPoint } from './geo';

/**
 * CLOUD6's normalized weather condition, independent of any provider's
 * own weather-code scheme. Providers map their codes onto this set.
 */
export type WeatherCode =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'unknown';

/** Snapshot of current conditions at a point. All units are CLOUD6-internal (see docs). */
export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  rainProbability: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number;
  visibility: number;
  weatherCode: WeatherCode;
  timestamp: string;
}

/** One hour of forecast data. */
export interface HourlyWeather {
  timestamp: string;
  temperature: number;
  precipitation: number;
  precipitationProbability: number;
  rainProbability: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  weatherCode: WeatherCode;
}

/** One day of forecast data. */
export interface DailyWeather {
  date: string;
  minTemperature: number;
  maxTemperature: number;
  precipitationProbability: number;
  precipitation: number;
  sunrise: string;
  sunset: string;
  weatherCode: WeatherCode;
}

/** Current weather for a specific location — what a "right now" screen needs. */
export interface WeatherSnapshot {
  location: GeoPoint;
  current: CurrentWeather;
}

/**
 * Hourly + daily forecast for a location. Kept together so a future
 * Journey Engine can request everything it needs for a route point in one
 * shape, rather than re-fetching per data type.
 */
export interface WeatherForecast {
  location: GeoPoint;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
}

/** Normalized air-quality reading — deliberately separate from weather models. */
export interface AirQuality {
  location: GeoPoint;
  aqi: number;
  pm2_5: number;
  pm10: number;
  timestamp: string;
}
