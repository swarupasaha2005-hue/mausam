import { Router, type Request, type Response } from 'express';
import { WeatherError, isValidGeoPoint, type GeoPoint } from '@cloud6/shared';
import { weatherService } from '../modules/weather/weather.service';

export const weatherRouter = Router();

const ERROR_STATUS: Record<WeatherError['code'], number> = {
  WEATHER_INVALID_COORDINATES: 400,
  WEATHER_TIMEOUT: 504,
  WEATHER_RATE_LIMITED: 429,
  WEATHER_PROVIDER_ERROR: 502,
  WEATHER_REQUEST_FAILED: 502,
  WEATHER_INVALID_RESPONSE: 502,
};

function parsePoint(req: Request): GeoPoint | undefined {
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);
  if (
    req.query.latitude === undefined ||
    req.query.longitude === undefined ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    return undefined;
  }
  const point = { latitude, longitude };
  return isValidGeoPoint(point) ? point : undefined;
}

function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), max);
}

function sendWeatherError(res: Response, error: WeatherError): void {
  const status = ERROR_STATUS[error.code] ?? 500;
  res.status(status).json({ error: { code: error.code, message: error.message } });
}

weatherRouter.get('/current', async (req, res) => {
  const point = parsePoint(req);
  if (!point) {
    return sendWeatherError(
      res,
      new WeatherError('WEATHER_INVALID_COORDINATES', 'latitude and longitude are required'),
    );
  }

  try {
    const current = await weatherService.getCurrentWeather(point);
    res.json({ location: point, current });
  } catch (cause) {
    sendWeatherError(
      res,
      cause instanceof WeatherError ? cause : new WeatherError('WEATHER_PROVIDER_ERROR'),
    );
  }
});

weatherRouter.get('/hourly', async (req, res) => {
  const point = parsePoint(req);
  if (!point) {
    return sendWeatherError(
      res,
      new WeatherError('WEATHER_INVALID_COORDINATES', 'latitude and longitude are required'),
    );
  }

  const hours = parsePositiveInt(req.query.hours, 24, 48);

  try {
    const hourly = await weatherService.getHourlyForecast(point, { hours });
    res.json({ location: point, hourly });
  } catch (cause) {
    sendWeatherError(
      res,
      cause instanceof WeatherError ? cause : new WeatherError('WEATHER_PROVIDER_ERROR'),
    );
  }
});

weatherRouter.get('/daily', async (req, res) => {
  const point = parsePoint(req);
  if (!point) {
    return sendWeatherError(
      res,
      new WeatherError('WEATHER_INVALID_COORDINATES', 'latitude and longitude are required'),
    );
  }

  const days = parsePositiveInt(req.query.days, 7, 14);

  try {
    const daily = await weatherService.getDailyForecast(point, { days });
    res.json({ location: point, daily });
  } catch (cause) {
    sendWeatherError(
      res,
      cause instanceof WeatherError ? cause : new WeatherError('WEATHER_PROVIDER_ERROR'),
    );
  }
});
