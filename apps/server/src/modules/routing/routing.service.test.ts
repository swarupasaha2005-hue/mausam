import { RouteError } from '@cloud6/shared';
import { RoutingService } from './routing.service';
import type { RoutingProvider } from './routing.types';
import { cloud6RouteFixture, DESTINATION, START } from '../../../test/fixtures/cloud6/route';

const INVALID_POINT = { latitude: 999, longitude: 0 };

function createProvider(overrides: Partial<RoutingProvider> = {}): RoutingProvider {
  return {
    getRoute: jest.fn().mockResolvedValue(cloud6RouteFixture),
    ...overrides,
  };
}

describe('RoutingService.getRoute', () => {
  it('returns the provider route for valid start + destination', async () => {
    const provider = createProvider();
    const service = new RoutingService(provider);

    const result = await service.getRoute(START, DESTINATION);

    expect(provider.getRoute).toHaveBeenCalledWith(START, DESTINATION);
    expect(result).toEqual(cloud6RouteFixture);
  });

  it('rejects an invalid start without calling the provider', async () => {
    const provider = createProvider();
    const service = new RoutingService(provider);

    await expect(service.getRoute(INVALID_POINT, DESTINATION)).rejects.toMatchObject({
      code: 'ROUTE_INVALID_COORDINATES',
    });
    expect(provider.getRoute).not.toHaveBeenCalled();
  });

  it('rejects an invalid destination without calling the provider', async () => {
    const provider = createProvider();
    const service = new RoutingService(provider);

    await expect(service.getRoute(START, INVALID_POINT)).rejects.toMatchObject({
      code: 'ROUTE_INVALID_COORDINATES',
    });
    expect(provider.getRoute).not.toHaveBeenCalled();
  });

  it('normalizes a provider failure into a RouteError', async () => {
    const provider = createProvider({ getRoute: jest.fn().mockRejectedValue(new Error('boom')) });
    const service = new RoutingService(provider);

    await expect(service.getRoute(START, DESTINATION)).rejects.toBeInstanceOf(RouteError);
    await expect(service.getRoute(START, DESTINATION)).rejects.toMatchObject({
      code: 'ROUTE_PROVIDER_ERROR',
    });
  });

  it('passes through a ROUTE_NOT_FOUND error from the provider', async () => {
    const provider = createProvider({
      getRoute: jest.fn().mockRejectedValue(new RouteError('ROUTE_NOT_FOUND')),
    });
    const service = new RoutingService(provider);

    await expect(service.getRoute(START, DESTINATION)).rejects.toMatchObject({
      code: 'ROUTE_NOT_FOUND',
    });
  });
});
