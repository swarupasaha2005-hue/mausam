import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  openMeteoBaseUrl: process.env.OPEN_METEO_BASE_URL ?? 'https://api.open-meteo.com/v1/forecast',
  openMeteoAirQualityBaseUrl:
    process.env.OPEN_METEO_AIR_QUALITY_BASE_URL ??
    'https://air-quality-api.open-meteo.com/v1/air-quality',
  weatherRequestTimeoutMs: Number(process.env.WEATHER_REQUEST_TIMEOUT_MS ?? 8000),
  osrmBaseUrl: process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org',
  routingRequestTimeoutMs: Number(process.env.ROUTING_REQUEST_TIMEOUT_MS ?? 8000),
};
