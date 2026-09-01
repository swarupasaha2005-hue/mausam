import type { Route } from '@cloud6/shared';

export const START = { latitude: 22.5726, longitude: 88.3639 };
export const DESTINATION = { latitude: 22.5958, longitude: 88.4497 };

/** Expected Route after mapping osrmRouteFixture. */
export const cloud6RouteFixture: Route = {
  start: START,
  destination: DESTINATION,
  distanceKm: 18.4,
  durationMinutes: 47,
  coordinates: [
    { latitude: 22.5726, longitude: 88.3639 },
    { latitude: 22.58, longitude: 88.4 },
    { latitude: 22.5958, longitude: 88.4497 },
  ],
};
