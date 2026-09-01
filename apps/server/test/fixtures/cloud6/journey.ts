import type {
  HourlyWeather,
  JourneyCheckpoint,
  JourneyPlan,
  JourneyWeatherCheckpoint,
  Route,
} from '@cloud6/shared';

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

export function makeCheckpoint(overrides: Partial<JourneyCheckpoint> = {}): JourneyCheckpoint {
  return {
    sequence: 1,
    point: { latitude: 22.5726, longitude: 88.3639 },
    distanceFromStartKm: 0,
    estimatedArrivalTime: '2026-09-01T16:00:00.000Z',
    ...overrides,
  };
}

export function makeWeatherCheckpoint(
  overrides: Partial<JourneyWeatherCheckpoint> = {},
): JourneyWeatherCheckpoint {
  return {
    sequence: 1,
    point: { latitude: 22.5726, longitude: 88.3639 },
    distanceFromStartKm: 0,
    estimatedArrivalTime: '2026-09-01T16:00:00.000Z',
    weather: null,
    ...overrides,
  };
}

export function makeHourlyWeather(overrides: Partial<HourlyWeather> = {}): HourlyWeather {
  return {
    timestamp: '2026-09-01T16:00:00.000Z',
    temperature: 30,
    precipitation: 0,
    precipitationProbability: 10,
    rainProbability: 10,
    humidity: 70,
    windSpeed: 10,
    uvIndex: 5,
    weatherCode: 'clear',
    ...overrides,
  };
}

/** A minimal 4-checkpoint JourneyPlan for weather-enrichment tests. */
export const journeyPlanFixture: JourneyPlan = {
  route: tenKmRouteFixture,
  departureTime: '2026-09-01T16:00:00.000Z',
  estimatedArrivalTime: '2026-09-01T16:30:00.000Z',
  durationMinutes: 30,
  checkpoints: [
    makeCheckpoint({
      sequence: 1,
      distanceFromStartKm: 0,
      estimatedArrivalTime: '2026-09-01T16:00:00.000Z',
    }),
    makeCheckpoint({
      sequence: 2,
      point: { latitude: 22.6, longitude: 88.3639 },
      distanceFromStartKm: 3.3,
      estimatedArrivalTime: '2026-09-01T16:10:00.000Z',
    }),
    makeCheckpoint({
      sequence: 3,
      point: { latitude: 22.63, longitude: 88.3639 },
      distanceFromStartKm: 6.6,
      estimatedArrivalTime: '2026-09-01T16:20:00.000Z',
    }),
    makeCheckpoint({
      sequence: 4,
      point: { latitude: 22.6626, longitude: 88.3639 },
      distanceFromStartKm: 10,
      estimatedArrivalTime: '2026-09-01T16:30:00.000Z',
    }),
  ],
};
