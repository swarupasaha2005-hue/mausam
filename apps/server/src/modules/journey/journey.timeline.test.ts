import { calculateJourneyTimeline } from './journey.timeline';

const DEPARTURE = new Date('2026-09-01T16:00:00.000Z'); // 4:00 PM UTC

describe('calculateJourneyTimeline', () => {
  it('sets the start checkpoint ETA to the departure time', () => {
    const checkpoints = [
      { sequence: 1, point: { latitude: 0, longitude: 0 }, distanceFromStartKm: 0 },
    ];
    const result = calculateJourneyTimeline(checkpoints, 10, 30, DEPARTURE);
    expect(result[0].estimatedArrivalTime).toBe(DEPARTURE.toISOString());
  });

  it('sets the destination ETA to approximately departure + duration', () => {
    const checkpoints = [
      { sequence: 1, point: { latitude: 0, longitude: 0 }, distanceFromStartKm: 0 },
      { sequence: 2, point: { latitude: 1, longitude: 1 }, distanceFromStartKm: 10 },
    ];
    const result = calculateJourneyTimeline(checkpoints, 10, 30, DEPARTURE);
    const expected = new Date(DEPARTURE.getTime() + 30 * 60 * 1000);
    expect(result[1].estimatedArrivalTime).toBe(expected.toISOString());
  });

  it('estimates a proportional ETA for a midpoint checkpoint (10km/30min, 5km -> +15min)', () => {
    const checkpoints = [
      { sequence: 1, point: { latitude: 0, longitude: 0 }, distanceFromStartKm: 0 },
      { sequence: 2, point: { latitude: 0.5, longitude: 0.5 }, distanceFromStartKm: 5 },
      { sequence: 3, point: { latitude: 1, longitude: 1 }, distanceFromStartKm: 10 },
    ];
    const result = calculateJourneyTimeline(checkpoints, 10, 30, DEPARTURE);
    const expectedMidpoint = new Date(DEPARTURE.getTime() + 15 * 60 * 1000);
    expect(result[1].estimatedArrivalTime).toBe(expectedMidpoint.toISOString());
  });

  it('produces the documented 12km/36min example timeline', () => {
    const checkpoints = [0, 2, 4, 6, 8, 10, 12].map((distanceFromStartKm, i) => ({
      sequence: i + 1,
      point: { latitude: 0, longitude: 0 },
      distanceFromStartKm,
    }));
    const result = calculateJourneyTimeline(checkpoints, 12, 36, DEPARTURE);
    const expectedOffsetsMinutes = [0, 6, 12, 18, 24, 30, 36];
    result.forEach((checkpoint, i) => {
      const expected = new Date(DEPARTURE.getTime() + expectedOffsetsMinutes[i] * 60 * 1000);
      expect(checkpoint.estimatedArrivalTime).toBe(expected.toISOString());
    });
  });

  it('is deterministic for the same inputs', () => {
    const checkpoints = [
      { sequence: 1, point: { latitude: 0, longitude: 0 }, distanceFromStartKm: 0 },
      { sequence: 2, point: { latitude: 1, longitude: 1 }, distanceFromStartKm: 10 },
    ];
    const first = calculateJourneyTimeline(checkpoints, 10, 30, DEPARTURE);
    const second = calculateJourneyTimeline(checkpoints, 10, 30, DEPARTURE);
    expect(first).toEqual(second);
  });

  it('does not divide by zero for a zero-distance route', () => {
    const checkpoints = [
      { sequence: 1, point: { latitude: 0, longitude: 0 }, distanceFromStartKm: 0 },
    ];
    const result = calculateJourneyTimeline(checkpoints, 0, 0, DEPARTURE);
    expect(result[0].estimatedArrivalTime).toBe(DEPARTURE.toISOString());
  });

  it('preserves sequence and point fields', () => {
    const point = { latitude: 22.5726, longitude: 88.3639 };
    const checkpoints = [{ sequence: 3, point, distanceFromStartKm: 4 }];
    const result = calculateJourneyTimeline(checkpoints, 10, 30, DEPARTURE);
    expect(result[0].sequence).toBe(3);
    expect(result[0].point).toEqual(point);
  });
});
