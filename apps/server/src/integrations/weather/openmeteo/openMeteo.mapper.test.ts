import { WeatherError } from '@cloud6/shared';
import {
  mapAirQuality,
  mapCurrentWeather,
  mapDailyWeather,
  mapHourlyWeather,
  normalizeOpenMeteoWeatherCode,
} from './openMeteo.mapper';
import { openMeteoForecastFixture } from '../../../../test/fixtures/openmeteo/forecast';
import { openMeteoAirQualityFixture } from '../../../../test/fixtures/openmeteo/airQuality';
import {
  cloud6CurrentWeatherFixture,
  cloud6DailyWeatherFixture,
  cloud6HourlyWeatherFixture,
} from '../../../../test/fixtures/cloud6/weather';

const POINT = { latitude: 22.5726, longitude: 88.3639 };

describe('normalizeOpenMeteoWeatherCode', () => {
  it.each([
    [0, 'clear'],
    [1, 'partly_cloudy'],
    [2, 'partly_cloudy'],
    [3, 'cloudy'],
    [45, 'fog'],
    [48, 'fog'],
    [51, 'drizzle'],
    [61, 'rain'],
    [80, 'rain'],
    [71, 'snow'],
    [85, 'snow'],
    [95, 'thunderstorm'],
    [99, 'thunderstorm'],
    [1000, 'unknown'],
  ])('maps WMO code %i to %s', (code, expected) => {
    expect(normalizeOpenMeteoWeatherCode(code)).toBe(expected);
  });
});

describe('mapCurrentWeather', () => {
  it('maps a full response to CurrentWeather', () => {
    expect(mapCurrentWeather(openMeteoForecastFixture)).toEqual(cloud6CurrentWeatherFixture);
  });

  it('throws WEATHER_INVALID_RESPONSE when the current block is missing', () => {
    expect(() => mapCurrentWeather({})).toThrow(WeatherError);
    expect(() => mapCurrentWeather({})).toThrow(
      expect.objectContaining({ code: 'WEATHER_INVALID_RESPONSE' }),
    );
  });

  it('defaults rainProbability/uvIndex/visibility to 0 when hourly data is missing', () => {
    const result = mapCurrentWeather({ current: openMeteoForecastFixture.current });
    expect(result.rainProbability).toBe(0);
    expect(result.uvIndex).toBe(0);
    expect(result.visibility).toBe(0);
  });
});

describe('mapHourlyWeather', () => {
  it('maps the hourly block to HourlyWeather[]', () => {
    expect(mapHourlyWeather(openMeteoForecastFixture.hourly)).toEqual(cloud6HourlyWeatherFixture);
  });

  it('throws WEATHER_INVALID_RESPONSE when the hourly block is missing', () => {
    expect(() => mapHourlyWeather(undefined)).toThrow(
      expect.objectContaining({ code: 'WEATHER_INVALID_RESPONSE' }),
    );
  });
});

describe('mapDailyWeather', () => {
  it('maps the daily block to DailyWeather[]', () => {
    expect(mapDailyWeather(openMeteoForecastFixture.daily)).toEqual(cloud6DailyWeatherFixture);
  });

  it('throws WEATHER_INVALID_RESPONSE when the daily block is missing', () => {
    expect(() => mapDailyWeather(undefined)).toThrow(
      expect.objectContaining({ code: 'WEATHER_INVALID_RESPONSE' }),
    );
  });
});

describe('mapAirQuality', () => {
  it('maps the air quality response to AirQuality', () => {
    expect(mapAirQuality(POINT, openMeteoAirQualityFixture)).toEqual({
      location: POINT,
      aqi: 58,
      pm2_5: 14.2,
      pm10: 22.5,
      timestamp: '2026-09-01T12:00',
    });
  });

  it('throws WEATHER_INVALID_RESPONSE when hourly data is missing', () => {
    expect(() => mapAirQuality(POINT, {})).toThrow(
      expect.objectContaining({ code: 'WEATHER_INVALID_RESPONSE' }),
    );
  });
});
