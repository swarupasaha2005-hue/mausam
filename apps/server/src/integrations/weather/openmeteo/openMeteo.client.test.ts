import { WeatherError } from '@cloud6/shared';
import { fetchOpenMeteoAirQuality, fetchOpenMeteoForecast } from './openMeteo.client';
import { openMeteoForecastFixture } from '../../../../test/fixtures/openmeteo/forecast';
import { openMeteoAirQualityFixture } from '../../../../test/fixtures/openmeteo/airQuality';

const POINT = { latitude: 22.5726, longitude: 88.3639 };

function mockFetchOnce(impl: () => Promise<Response> | Response) {
  global.fetch = jest.fn(impl) as unknown as typeof fetch;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('fetchOpenMeteoForecast', () => {
  it('returns the parsed response on success', async () => {
    mockFetchOnce(
      () =>
        new Response(JSON.stringify(openMeteoForecastFixture), {
          status: 200,
        }),
    );

    const result = await fetchOpenMeteoForecast(POINT);
    expect(result).toEqual(openMeteoForecastFixture);
  });

  it('throws WEATHER_RATE_LIMITED on HTTP 429', async () => {
    mockFetchOnce(() => new Response('{}', { status: 429 }));

    await expect(fetchOpenMeteoForecast(POINT)).rejects.toMatchObject({
      code: 'WEATHER_RATE_LIMITED',
    });
  });

  it('throws WEATHER_PROVIDER_ERROR on other HTTP failures', async () => {
    mockFetchOnce(() => new Response('{}', { status: 500 }));

    await expect(fetchOpenMeteoForecast(POINT)).rejects.toMatchObject({
      code: 'WEATHER_PROVIDER_ERROR',
    });
  });

  it('throws WEATHER_REQUEST_FAILED on network failure', async () => {
    mockFetchOnce(() => Promise.reject(new Error('getaddrinfo ENOTFOUND')));

    await expect(fetchOpenMeteoForecast(POINT)).rejects.toBeInstanceOf(WeatherError);
    await expect(fetchOpenMeteoForecast(POINT)).rejects.toMatchObject({
      code: 'WEATHER_REQUEST_FAILED',
    });
  });

  it('throws WEATHER_TIMEOUT when the request is aborted', async () => {
    mockFetchOnce(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(fetchOpenMeteoForecast(POINT)).rejects.toMatchObject({
      code: 'WEATHER_TIMEOUT',
    });
  });

  it('throws WEATHER_INVALID_RESPONSE on malformed JSON', async () => {
    mockFetchOnce(() => new Response('not json{{{', { status: 200 }));

    await expect(fetchOpenMeteoForecast(POINT)).rejects.toMatchObject({
      code: 'WEATHER_INVALID_RESPONSE',
    });
  });
});

describe('fetchOpenMeteoAirQuality', () => {
  it('returns the parsed response on success', async () => {
    mockFetchOnce(
      () =>
        new Response(JSON.stringify(openMeteoAirQualityFixture), {
          status: 200,
        }),
    );

    const result = await fetchOpenMeteoAirQuality(POINT);
    expect(result).toEqual(openMeteoAirQualityFixture);
  });
});
