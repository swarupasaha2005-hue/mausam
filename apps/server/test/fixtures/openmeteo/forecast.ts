import type { OpenMeteoForecastResponse } from '../../../src/integrations/weather/openmeteo/openMeteo.types';

/** Minimal but representative Open-Meteo /v1/forecast response. */
export const openMeteoForecastFixture: OpenMeteoForecastResponse = {
  current: {
    time: '2026-09-01T12:00',
    temperature_2m: 31.2,
    apparent_temperature: 35.1,
    relative_humidity_2m: 78,
    precipitation: 0,
    weather_code: 2,
    wind_speed_10m: 14.4,
    wind_direction_10m: 180,
  },
  hourly: {
    time: ['2026-09-01T11:00', '2026-09-01T12:00', '2026-09-01T13:00'],
    temperature_2m: [30.1, 31.2, 31.8],
    precipitation: [0, 0, 0.2],
    precipitation_probability: [10, 25, 30],
    relative_humidity_2m: [80, 78, 76],
    wind_speed_10m: [13.1, 14.4, 15.0],
    uv_index: [5, 7, 7.5],
    visibility: [24000, 24000, 22000],
    weather_code: [1, 2, 3],
  },
  daily: {
    time: ['2026-09-01', '2026-09-02'],
    temperature_2m_max: [33.5, 32.1],
    temperature_2m_min: [26.0, 25.4],
    precipitation_probability_max: [40, 55],
    precipitation_sum: [2.1, 5.4],
    sunrise: ['2026-09-01T05:32', '2026-09-02T05:33'],
    sunset: ['2026-09-01T18:12', '2026-09-02T18:11'],
    weather_code: [2, 61],
  },
};
