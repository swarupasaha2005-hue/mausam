import { sampleRoute } from './journey.sampler';
import {
  longRouteFixture,
  shortRouteFixture,
  tenKmRouteFixture,
} from '../../../test/fixtures/cloud6/journey';

describe('sampleRoute — short routes', () => {
  it('produces only start + destination for a very short (~200m) route', () => {
    const checkpoints = sampleRoute(shortRouteFixture);
    expect(checkpoints.length).toBe(2);
    expect(checkpoints[0].distanceFromStartKm).toBe(0);
    expect(checkpoints[0].point).toEqual(shortRouteFixture.start);
    expect(checkpoints[1].point).toEqual(shortRouteFixture.destination);
  });

  it('does not force a 2km interval onto a sub-2km route', () => {
    const checkpoints = sampleRoute(shortRouteFixture, { intervalKm: 2 });
    expect(checkpoints.length).toBe(2);
  });
});

describe('sampleRoute — a ~10km route', () => {
  it('includes the start point first', () => {
    const checkpoints = sampleRoute(tenKmRouteFixture);
    expect(checkpoints[0].distanceFromStartKm).toBe(0);
    expect(checkpoints[0].point).toEqual(tenKmRouteFixture.coordinates[0]);
  });

  it('includes the destination last', () => {
    const checkpoints = sampleRoute(tenKmRouteFixture);
    const last = checkpoints[checkpoints.length - 1];
    expect(last.point).toEqual(
      tenKmRouteFixture.coordinates[tenKmRouteFixture.coordinates.length - 1],
    );
  });

  it('keeps checkpoints in route order with strictly increasing distance', () => {
    const checkpoints = sampleRoute(tenKmRouteFixture);
    for (let i = 1; i < checkpoints.length; i += 1) {
      expect(checkpoints[i].distanceFromStartKm).toBeGreaterThan(
        checkpoints[i - 1].distanceFromStartKm,
      );
      expect(checkpoints[i].sequence).toBe(checkpoints[i - 1].sequence + 1);
    }
  });

  it('produces a reasonable checkpoint count for the default 2km interval', () => {
    const checkpoints = sampleRoute(tenKmRouteFixture);
    // ~10km / 2km interval ≈ 6 checkpoints, well under the max.
    expect(checkpoints.length).toBeGreaterThanOrEqual(5);
    expect(checkpoints.length).toBeLessThanOrEqual(8);
  });

  it('produces more checkpoints for a smaller interval', () => {
    const wideInterval = sampleRoute(tenKmRouteFixture, { intervalKm: 5 });
    const narrowInterval = sampleRoute(tenKmRouteFixture, { intervalKm: 1 });
    expect(narrowInterval.length).toBeGreaterThan(wideInterval.length);
  });
});

describe('sampleRoute — maximum checkpoints', () => {
  it('does not exceed the configured max for a long route', () => {
    const checkpoints = sampleRoute(longRouteFixture, { maxCheckpoints: 20 });
    expect(checkpoints.length).toBeLessThanOrEqual(20);
  });

  it('still includes start and destination when capped', () => {
    const checkpoints = sampleRoute(longRouteFixture, { maxCheckpoints: 10 });
    expect(checkpoints[0].point).toEqual(longRouteFixture.coordinates[0]);
    expect(checkpoints[checkpoints.length - 1].point).toEqual(
      longRouteFixture.coordinates[longRouteFixture.coordinates.length - 1],
    );
    expect(checkpoints.length).toBeLessThanOrEqual(10);
  });

  it('does not produce hundreds of checkpoints for a route with hundreds of coordinates', () => {
    const checkpoints = sampleRoute(longRouteFixture);
    expect(checkpoints.length).toBeLessThan(longRouteFixture.coordinates.length);
  });
});

describe('sampleRoute — determinism', () => {
  it('produces the same result for the same route and options', () => {
    const first = sampleRoute(tenKmRouteFixture, { intervalKm: 2 });
    const second = sampleRoute(tenKmRouteFixture, { intervalKm: 2 });
    expect(first).toEqual(second);
  });
});
