import type { Route } from '@cloud6/shared';

/** ~10 evenly-spaced coordinates along a straight line, ~1.1 km apart (~10 km total). */
function straightLineCoordinates(count: number, stepDegrees: number) {
  return Array.from({ length: count }, (_, i) => ({
    latitude: 22.5726 + i * stepDegrees,
    longitude: 88.3639,
  }));
}

/** Roughly a 10 km route (0.01 degrees latitude ≈ 1.11 km). */
export const tenKmRouteFixture: Route = {
  start: { latitude: 22.5726, longitude: 88.3639 },
  destination: { latitude: 22.6626, longitude: 88.3639 },
  distanceKm: 10,
  durationMinutes: 30,
  coordinates: straightLineCoordinates(10, 0.01),
};

/** A short (~200 m) route — should not be over-sampled. */
export const shortRouteFixture: Route = {
  start: { latitude: 22.5726, longitude: 88.3639 },
  destination: { latitude: 22.5744, longitude: 88.3639 },
  distanceKm: 0.2,
  durationMinutes: 2,
  coordinates: [
    { latitude: 22.5726, longitude: 88.3639 },
    { latitude: 22.5744, longitude: 88.3639 },
  ],
};

/** A long (~100 km) route with many coordinates. */
export const longRouteFixture: Route = {
  start: { latitude: 22.5726, longitude: 88.3639 },
  destination: { latitude: 23.4726, longitude: 88.3639 },
  distanceKm: 100,
  durationMinutes: 120,
  coordinates: straightLineCoordinates(100, 0.009),
};
