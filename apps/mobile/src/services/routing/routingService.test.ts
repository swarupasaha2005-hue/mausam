import { RouteError } from '@cloud6/shared';
import { routingService } from './routingService';

const START = { latitude: 22.5726, longitude: 88.3639 };
const DESTINATION = { latitude: 22.5958, longitude: 88.4497 };

function mockFetch(impl: () => Promise<Response> | Response) {
  globalThis.fetch = jest.fn(impl) as unknown as typeof fetch;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('routingService.getRoute', () => {
  it('calls the CLOUD6 backend, not OSRM', async () => {
    const route = {
      start: START,
      destination: DESTINATION,
      distanceKm: 18.4,
      durationMinutes: 47,
      coordinates: [START, DESTINATION],
    };
    mockFetch(() => new Response(JSON.stringify(route), { status: 200 }));

    const result = await routingService.getRoute(START, DESTINATION);

    expect(result).toEqual(route);
    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/routes');
    expect(calledUrl).not.toContain('router.project-osrm.org');
  });

  it('normalizes a backend error response into a RouteError with the backend code', async () => {
    mockFetch(
      () => new Response(JSON.stringify({ error: { code: 'ROUTE_NOT_FOUND' } }), { status: 404 }),
    );

    await expect(routingService.getRoute(START, DESTINATION)).rejects.toBeInstanceOf(RouteError);
    await expect(routingService.getRoute(START, DESTINATION)).rejects.toMatchObject({
      code: 'ROUTE_NOT_FOUND',
    });
  });

  it('normalizes a network failure into ROUTE_REQUEST_FAILED', async () => {
    mockFetch(() => Promise.reject(new Error('Network request failed')));

    await expect(routingService.getRoute(START, DESTINATION)).rejects.toMatchObject({
      code: 'ROUTE_REQUEST_FAILED',
    });
  });

  it('normalizes malformed JSON into ROUTE_INVALID_RESPONSE', async () => {
    mockFetch(() => new Response('not json{{', { status: 200 }));

    await expect(routingService.getRoute(START, DESTINATION)).rejects.toMatchObject({
      code: 'ROUTE_INVALID_RESPONSE',
    });
  });
});
