import { JourneyError } from '@cloud6/shared';
import { JourneyService } from './journey.service';
import { tenKmRouteFixture } from '../../../test/fixtures/cloud6/journey';

describe('JourneyService.planJourney', () => {
  const service = new JourneyService();

  it('produces a JourneyPlan for a valid route', () => {
    const plan = service.planJourney({
      route: tenKmRouteFixture,
      departureTime: '2026-09-01T16:00:00.000Z',
    });

    expect(plan.route).toEqual(tenKmRouteFixture);
    expect(plan.departureTime).toBe('2026-09-01T16:00:00.000Z');
    expect(plan.durationMinutes).toBe(tenKmRouteFixture.durationMinutes);
    expect(plan.checkpoints.length).toBeGreaterThan(1);
    expect(plan.checkpoints[0].estimatedArrivalTime).toBe('2026-09-01T16:00:00.000Z');
    expect(plan.estimatedArrivalTime).toBe(
      plan.checkpoints[plan.checkpoints.length - 1].estimatedArrivalTime,
    );
  });

  it('defaults departureTime to now when omitted', () => {
    const before = Date.now();
    const plan = service.planJourney({ route: tenKmRouteFixture });
    const after = Date.now();
    const departureMs = new Date(plan.departureTime).getTime();
    expect(departureMs).toBeGreaterThanOrEqual(before);
    expect(departureMs).toBeLessThanOrEqual(after);
  });

  it('respects custom sampling options', () => {
    const plan = service.planJourney({ route: tenKmRouteFixture, options: { intervalKm: 5 } });
    const withWideInterval = plan.checkpoints.length;
    const plan2 = service.planJourney({ route: tenKmRouteFixture, options: { intervalKm: 1 } });
    expect(plan2.checkpoints.length).toBeGreaterThan(withWideInterval);
  });

  it('throws JOURNEY_INVALID_ROUTE for a missing route', () => {
    expect(() => service.planJourney({ route: undefined })).toThrow(
      expect.objectContaining({ code: 'JOURNEY_INVALID_ROUTE' }),
    );
  });

  it('throws JOURNEY_INVALID_ROUTE for missing coordinates', () => {
    expect(() => service.planJourney({ route: { ...tenKmRouteFixture, coordinates: [] } })).toThrow(
      expect.objectContaining({ code: 'JOURNEY_INVALID_ROUTE' }),
    );
  });

  it('throws JOURNEY_INVALID_ROUTE for an invalid coordinate', () => {
    expect(() =>
      service.planJourney({
        route: { ...tenKmRouteFixture, coordinates: [{ latitude: 999, longitude: 0 }] },
      }),
    ).toThrow(expect.objectContaining({ code: 'JOURNEY_INVALID_ROUTE' }));
  });

  it('throws JOURNEY_INVALID_ROUTE for a negative distance', () => {
    expect(() => service.planJourney({ route: { ...tenKmRouteFixture, distanceKm: -5 } })).toThrow(
      expect.objectContaining({ code: 'JOURNEY_INVALID_ROUTE' }),
    );
  });

  it('throws JOURNEY_INVALID_ROUTE for an invalid duration', () => {
    expect(() =>
      service.planJourney({ route: { ...tenKmRouteFixture, durationMinutes: 'soon' } }),
    ).toThrow(expect.objectContaining({ code: 'JOURNEY_INVALID_ROUTE' }));
  });

  it('throws JOURNEY_INVALID_DEPARTURE_TIME for an unparseable departureTime', () => {
    expect(() =>
      service.planJourney({ route: tenKmRouteFixture, departureTime: 'not-a-date' }),
    ).toThrow(expect.objectContaining({ code: 'JOURNEY_INVALID_DEPARTURE_TIME' }));
  });

  it('throws JOURNEY_INVALID_OPTIONS for an invalid intervalKm', () => {
    expect(() =>
      service.planJourney({ route: tenKmRouteFixture, options: { intervalKm: -1 } }),
    ).toThrow(expect.objectContaining({ code: 'JOURNEY_INVALID_OPTIONS' }));
  });

  it('is deterministic for the same route, options, and departureTime', () => {
    const input = {
      route: tenKmRouteFixture,
      departureTime: '2026-09-01T16:00:00.000Z',
      options: { intervalKm: 2 },
    };
    const first = service.planJourney(input);
    const second = service.planJourney(input);
    expect(first).toEqual(second);
  });

  it('is an instance of JourneyError for all validation failures', () => {
    try {
      service.planJourney({ route: null });
      fail('expected to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(JourneyError);
    }
  });
});
