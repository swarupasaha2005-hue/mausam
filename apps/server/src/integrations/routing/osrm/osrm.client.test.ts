import { RouteError } from '@cloud6/shared';
import { fetchOsrmRoute } from './osrm.client';
import { osrmRouteFixture } from '../../../../test/fixtures/osrm/route';
import { DESTINATION, START } from '../../../../test/fixtures/cloud6/route';

function mockFetchOnce(impl: () => Promise<Response> | Response) {
  global.fetch = jest.fn(impl) as unknown as typeof fetch;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('fetchOsrmRoute', () => {
  it('returns the parsed response on success', async () => {
    mockFetchOnce(() => new Response(JSON.stringify(osrmRouteFixture), { status: 200 }));

    const result = await fetchOsrmRoute(START, DESTINATION);
    expect(result).toEqual(osrmRouteFixture);
  });

  it('throws ROUTE_PROVIDER_ERROR on HTTP failure', async () => {
    mockFetchOnce(() => new Response('{}', { status: 500 }));

    await expect(fetchOsrmRoute(START, DESTINATION)).rejects.toMatchObject({
      code: 'ROUTE_PROVIDER_ERROR',
    });
  });

  it('throws ROUTE_REQUEST_FAILED on network failure', async () => {
    mockFetchOnce(() => Promise.reject(new Error('getaddrinfo ENOTFOUND')));

    await expect(fetchOsrmRoute(START, DESTINATION)).rejects.toBeInstanceOf(RouteError);
    await expect(fetchOsrmRoute(START, DESTINATION)).rejects.toMatchObject({
      code: 'ROUTE_REQUEST_FAILED',
    });
  });

  it('throws ROUTE_TIMEOUT when the request is aborted', async () => {
    mockFetchOnce(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(fetchOsrmRoute(START, DESTINATION)).rejects.toMatchObject({
      code: 'ROUTE_TIMEOUT',
    });
  });

  it('throws ROUTE_INVALID_RESPONSE on malformed JSON', async () => {
    mockFetchOnce(() => new Response('not json{{{', { status: 200 }));

    await expect(fetchOsrmRoute(START, DESTINATION)).rejects.toMatchObject({
      code: 'ROUTE_INVALID_RESPONSE',
    });
  });
});
