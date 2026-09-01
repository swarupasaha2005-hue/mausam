import request from 'supertest';
import { WeatherError } from '@cloud6/shared';
import {
  cloud6CurrentWeatherFixture,
  cloud6DailyWeatherFixture,
  cloud6HourlyWeatherFixture,
} from '../../test/fixtures/cloud6/weather';

jest.mock('../modules/weather/weather.service', () => ({
  weatherService: {
    getCurrentWeather: jest.fn(),
    getHourlyForecast: jest.fn(),
    getDailyForecast: jest.fn(),
  },
}));

import { app } from '../app';
import { weatherService } from '../modules/weather/weather.service';

const mockedWeatherService = jest.mocked(weatherService);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/weather/current', () => {
  it('returns normalized CLOUD6 weather for valid coordinates', async () => {
    mockedWeatherService.getCurrentWeather.mockResolvedValue(cloud6CurrentWeatherFixture);

    const response = await request(app).get('/api/weather/current').query({
      latitude: 22.5726,
      longitude: 88.3639,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      location: { latitude: 22.5726, longitude: 88.3639 },
      current: cloud6CurrentWeatherFixture,
    });
  });

  it('does not leak raw Open-Meteo field names', async () => {
    mockedWeatherService.getCurrentWeather.mockResolvedValue(cloud6CurrentWeatherFixture);

    const response = await request(app).get('/api/weather/current').query({
      latitude: 22.5726,
      longitude: 88.3639,
    });

    const raw = JSON.stringify(response.body);
    expect(raw).not.toContain('temperature_2m');
    expect(raw).not.toContain('weather_code');
  });

  it('returns 400 for an invalid latitude', async () => {
    const response = await request(app).get('/api/weather/current').query({
      latitude: 999,
      longitude: 88.3639,
    });

    expect(mockedWeatherService.getCurrentWeather).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('WEATHER_INVALID_COORDINATES');
  });

  it('returns 400 for missing parameters', async () => {
    const response = await request(app).get('/api/weather/current');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('WEATHER_INVALID_COORDINATES');
  });

  it('maps a provider failure to a 502', async () => {
    mockedWeatherService.getCurrentWeather.mockRejectedValue(
      new WeatherError('WEATHER_PROVIDER_ERROR'),
    );

    const response = await request(app).get('/api/weather/current').query({
      latitude: 22.5726,
      longitude: 88.3639,
    });

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('WEATHER_PROVIDER_ERROR');
  });
});

describe('GET /api/weather/hourly', () => {
  it('returns normalized hourly forecast data', async () => {
    mockedWeatherService.getHourlyForecast.mockResolvedValue(cloud6HourlyWeatherFixture);

    const response = await request(app).get('/api/weather/hourly').query({
      latitude: 22.5726,
      longitude: 88.3639,
    });

    expect(response.status).toBe(200);
    expect(response.body.hourly).toEqual(cloud6HourlyWeatherFixture);
  });

  it('returns 400 for an invalid longitude', async () => {
    const response = await request(app).get('/api/weather/hourly').query({
      latitude: 22.5726,
      longitude: 999,
    });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/weather/daily', () => {
  it('returns normalized daily forecast data', async () => {
    mockedWeatherService.getDailyForecast.mockResolvedValue(cloud6DailyWeatherFixture);

    const response = await request(app).get('/api/weather/daily').query({
      latitude: 22.5726,
      longitude: 88.3639,
    });

    expect(response.status).toBe(200);
    expect(response.body.daily).toEqual(cloud6DailyWeatherFixture);
  });
});
