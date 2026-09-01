import { RouteError } from '@cloud6/shared';
import { mapOsrmRoute } from './osrm.mapper';
import { osrmNoRouteFixture, osrmRouteFixture } from '../../../../test/fixtures/osrm/route';
import { cloud6RouteFixture, DESTINATION, START } from '../../../../test/fixtures/cloud6/route';

describe('mapOsrmRoute', () => {
  it('maps distance (meters) to distanceKm', () => {
    const result = mapOsrmRoute(osrmRouteFixture, START, DESTINATION);
    expect(result.distanceKm).toBe(cloud6RouteFixture.distanceKm);
  });

  it('maps duration (seconds) to durationMinutes', () => {
    const result = mapOsrmRoute(osrmRouteFixture, START, DESTINATION);
    expect(result.durationMinutes).toBe(cloud6RouteFixture.durationMinutes);
  });

  it('maps geometry [lon,lat] pairs to GeoPoint[]', () => {
    const result = mapOsrmRoute(osrmRouteFixture, START, DESTINATION);
    expect(result.coordinates).toEqual(cloud6RouteFixture.coordinates);
  });

  it('carries through the requested start/destination', () => {
    const result = mapOsrmRoute(osrmRouteFixture, START, DESTINATION);
    expect(result.start).toEqual(START);
    expect(result.destination).toEqual(DESTINATION);
  });

  it('throws ROUTE_NOT_FOUND when OSRM reports no route', () => {
    expect(() => mapOsrmRoute(osrmNoRouteFixture, START, DESTINATION)).toThrow(
      expect.objectContaining({ code: 'ROUTE_NOT_FOUND' }),
    );
  });

  it('throws ROUTE_NOT_FOUND when the routes array is empty', () => {
    expect(() => mapOsrmRoute({ code: 'Ok', routes: [] }, START, DESTINATION)).toThrow(
      expect.objectContaining({ code: 'ROUTE_NOT_FOUND' }),
    );
  });

  it('throws ROUTE_INVALID_RESPONSE when distance/duration are missing', () => {
    expect(() =>
      mapOsrmRoute(
        {
          code: 'Ok',
          routes: [{ geometry: osrmRouteFixture.routes![0].geometry } as never],
        },
        START,
        DESTINATION,
      ),
    ).toThrow(RouteError);
  });

  it('throws ROUTE_INVALID_RESPONSE when geometry is missing', () => {
    expect(() =>
      mapOsrmRoute(
        { code: 'Ok', routes: [{ distance: 100, duration: 10 } as never] },
        START,
        DESTINATION,
      ),
    ).toThrow(expect.objectContaining({ code: 'ROUTE_INVALID_RESPONSE' }));
  });
});
