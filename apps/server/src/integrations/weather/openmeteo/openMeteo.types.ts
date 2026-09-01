/**
 * Raw Open-Meteo response shapes. Only the fields CLOUD6 actually reads
 * are declared — this is not a full mirror of Open-Meteo's schema. These
 * types must never leak past openMeteo.mapper.ts.
 */
export interface OpenMeteoCurrentBlock {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
}

export interface OpenMeteoHourlyBlock {
  time: string[];
  temperature_2m: number[];
  precipitation: number[];
  precipitation_probability: number[];
  relative_humidity_2m: number[];
  wind_speed_10m: number[];
  uv_index: number[];
  visibility: number[];
  weather_code: number[];
}

export interface OpenMeteoDailyBlock {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
  precipitation_sum: number[];
  sunrise: string[];
  sunset: string[];
  weather_code: number[];
}

export interface OpenMeteoForecastResponse {
  current?: OpenMeteoCurrentBlock;
  hourly?: OpenMeteoHourlyBlock;
  daily?: OpenMeteoDailyBlock;
}

export interface OpenMeteoAirQualityHourlyBlock {
  time: string[];
  us_aqi: number[];
  pm2_5: number[];
  pm10: number[];
}

export interface OpenMeteoAirQualityResponse {
  hourly?: OpenMeteoAirQualityHourlyBlock;
}
