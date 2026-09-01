import type {
  AirQuality,
  CurrentWeather,
  DailyWeather,
  GeoPoint,
  HourlyWeather,
} from '@cloud6/shared';

export interface HourlyForecastOptions {
  hours?: number;
}

export interface DailyForecastOptions {
  days?: number;
}

/**
 * Port the weather module depends on. `OpenMeteoWeatherProvider` is the
 * only adapter today, but nothing here is Open-Meteo-specific — swapping
 * providers later means writing a new adapter, not touching WeatherService
 * or anything that consumes it.
 */
export interface WeatherProvider {
  getCurrentWeather(point: GeoPoint): Promise<CurrentWeather>;
  getHourlyForecast(point: GeoPoint, options?: HourlyForecastOptions): Promise<HourlyWeather[]>;
  getDailyForecast(point: GeoPoint, options?: DailyForecastOptions): Promise<DailyWeather[]>;
  getAirQuality(point: GeoPoint): Promise<AirQuality>;
}
