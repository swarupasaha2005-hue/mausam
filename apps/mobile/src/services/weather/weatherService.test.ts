import { WeatherError } from '@cloud6/shared';
import { weatherService } from './weatherService';

const POINT = { latitude: 22.5726, longitude: 88.3639 };

function mockFetch(impl: () => Promise<Response> | Response) {
  globalThis.fetch = jest.fn(impl) as unknown as typeof fetch;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('weatherService.getCurrentWeather', () => {
  it('calls the CLOUD6 backend, not Open-Meteo', async () => {
    const snapshot = {
      location: POINT,
      current: {
        temperature: 31.2,
        feelsLike: 35.1,
        humidity: 78,
        precipitation: 0,
        rainProbability: 25,
        windSpeed: 14.4,
        windDirection: 180,
        uvIndex: 7,
        visibility: 24,
        weatherCode: 'partly_cloudy',
        timestamp: '2026-09-01T12:00',
      },
    };
    mockFetch(() => new Response(JSON.stringify(snapshot), { status: 200 }));

    const result = await weatherService.getCurrentWeather(POINT);

    expect(result).toEqual(snapshot);
    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/weather/current');
    expect(calledUrl).not.toContain('open-meteo.com');
  });

  it('normalizes a backend error response into a WeatherError with the backend code', async () => {
    mockFetch(
      () =>
        new Response(JSON.stringify({ error: { code: 'WEATHER_INVALID_COORDINATES' } }), {
          status: 400,
        }),
    );

    await expect(weatherService.getCurrentWeather(POINT)).rejects.toBeInstanceOf(WeatherError);
    await expect(weatherService.getCurrentWeather(POINT)).rejects.toMatchObject({
      code: 'WEATHER_INVALID_COORDINATES',
    });
  });

  it('normalizes a network failure into WEATHER_REQUEST_FAILED', async () => {
    mockFetch(() => Promise.reject(new Error('Network request failed')));

    await expect(weatherService.getCurrentWeather(POINT)).rejects.toMatchObject({
      code: 'WEATHER_REQUEST_FAILED',
    });
  });

  it('normalizes malformed JSON into WEATHER_INVALID_RESPONSE', async () => {
    mockFetch(() => new Response('not json{{', { status: 200 }));

    await expect(weatherService.getCurrentWeather(POINT)).rejects.toMatchObject({
      code: 'WEATHER_INVALID_RESPONSE',
    });
  });
});

describe('weatherService.getHourlyForecast', () => {
  it('calls the hourly endpoint on the CLOUD6 backend', async () => {
    mockFetch(() => new Response(JSON.stringify({ location: POINT, hourly: [] }), { status: 200 }));

    await weatherService.getHourlyForecast(POINT, 12);

    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/weather/hourly');
    expect(calledUrl).toContain('hours=12');
  });
});

describe('weatherService.getDailyForecast', () => {
  it('calls the daily endpoint on the CLOUD6 backend', async () => {
    mockFetch(() => new Response(JSON.stringify({ location: POINT, daily: [] }), { status: 200 }));

    await weatherService.getDailyForecast(POINT, 3);

    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/weather/daily');
    expect(calledUrl).toContain('days=3');
  });
});
