import type { OsrmRouteResponse } from '../../../src/integrations/routing/osrm/osrm.types';

/** Minimal but representative OSRM /route/v1/driving response (geometries=geojson). */
export const osrmRouteFixture: OsrmRouteResponse = {
  code: 'Ok',
  routes: [
    {
      distance: 18400, // meters
      duration: 2820, // seconds
      geometry: {
        type: 'LineString',
        coordinates: [
          [88.3639, 22.5726],
          [88.4, 22.58],
          [88.4497, 22.5958],
        ],
      },
    },
  ],
};

export const osrmNoRouteFixture: OsrmRouteResponse = {
  code: 'NoRoute',
  message: 'Impossible route between points',
};
