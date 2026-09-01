import type {
  AirQuality,
  CurrentWeather,
  DailyWeather,
  GeoPoint,
  HourlyWeather,
  WeatherCode,
} from '@cloud6/shared';
import { WeatherError } from '@cloud6/shared';
import type {
  OpenMeteoAirQualityResponse,
  OpenMeteoDailyBlock,
  OpenMeteoForecastResponse,
  OpenMeteoHourlyBlock,
} from './openMeteo.types';

/**
 * Maps Open-Meteo's WMO weather codes onto CLOUD6's normalized WeatherCode.
 * See https://open-meteo.com/en/docs (WMO Weather interpretation codes).
 * This mapping is Open-Meteo-specific and must not be reused as a general
 * "weather code" concept outside this integration.
 */
export function normalizeOpenMeteoWeatherCode(code: number): WeatherCode {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly_cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code === 95 || code === 96 || code === 99) return 'thunderstorm';
  return 'unknown';
}

function findNearestIndex(times: string[], targetIso: string): number {
  const target = new Date(targetIso).getTime();
  let bestIndex = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i += 1) {
    const diff = Math.abs(new Date(times[i]).getTime() - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }
  return bestIndex;
}

export function mapCurrentWeather(response: OpenMeteoForecastResponse): CurrentWeather {
  const current = response.current;
  if (!current) {
    throw new WeatherError('WEATHER_INVALID_RESPONSE', 'Open-Meteo response missing current block');
  }

  const hourly = response.hourly;
  const nearestIndex = hourly ? findNearestIndex(hourly.time, current.time) : -1;

  return {
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    precipitation: current.precipitation,
    rainProbability:
      hourly && nearestIndex >= 0 ? hourly.precipitation_probability[nearestIndex] : 0,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    uvIndex: hourly && nearestIndex >= 0 ? hourly.uv_index[nearestIndex] : 0,
    visibility: hourly && nearestIndex >= 0 ? hourly.visibility[nearestIndex] / 1000 : 0,
    weatherCode: normalizeOpenMeteoWeatherCode(current.weather_code),
    timestamp: current.time,
  };
}

export function mapHourlyWeather(block: OpenMeteoHourlyBlock | undefined): HourlyWeather[] {
  if (!block) {
    throw new WeatherError('WEATHER_INVALID_RESPONSE', 'Open-Meteo response missing hourly block');
  }

  return block.time.map((timestamp, i) => ({
    timestamp,
    temperature: block.temperature_2m[i],
    precipitation: block.precipitation[i],
    precipitationProbability: block.precipitation_probability[i],
    rainProbability: block.precipitation_probability[i],
    humidity: block.relative_humidity_2m[i],
    windSpeed: block.wind_speed_10m[i],
    uvIndex: block.uv_index[i],
    weatherCode: normalizeOpenMeteoWeatherCode(block.weather_code[i]),
  }));
}

export function mapDailyWeather(block: OpenMeteoDailyBlock | undefined): DailyWeather[] {
  if (!block) {
    throw new WeatherError('WEATHER_INVALID_RESPONSE', 'Open-Meteo response missing daily block');
  }

  return block.time.map((date, i) => ({
    date,
    minTemperature: block.temperature_2m_min[i],
    maxTemperature: block.temperature_2m_max[i],
    precipitationProbability: block.precipitation_probability_max[i],
    precipitation: block.precipitation_sum[i],
    sunrise: block.sunrise[i],
    sunset: block.sunset[i],
    weatherCode: normalizeOpenMeteoWeatherCode(block.weather_code[i]),
  }));
}

export function mapAirQuality(point: GeoPoint, response: OpenMeteoAirQualityResponse): AirQuality {
  const hourly = response.hourly;
  if (!hourly || hourly.time.length === 0) {
    throw new WeatherError(
      'WEATHER_INVALID_RESPONSE',
      'Open-Meteo air quality response missing hourly block',
    );
  }

  return {
    location: point,
    aqi: hourly.us_aqi[0],
    pm2_5: hourly.pm2_5[0],
    pm10: hourly.pm10[0],
    timestamp: hourly.time[0],
  };
}
