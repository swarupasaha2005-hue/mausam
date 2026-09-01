import type { OpenMeteoAirQualityResponse } from '../../../src/integrations/weather/openmeteo/openMeteo.types';

export const openMeteoAirQualityFixture: OpenMeteoAirQualityResponse = {
  hourly: {
    time: ['2026-09-01T12:00'],
    us_aqi: [58],
    pm2_5: [14.2],
    pm10: [22.5],
  },
};
