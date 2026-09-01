import { cumulativeDistanceKm, haversineDistanceKm } from './journey.distance';

describe('haversineDistanceKm', () => {
  it('returns 0 for the same point', () => {
    const point = { latitude: 22.5726, longitude: 88.3639 };
    expect(haversineDistanceKm(point, point)).toBe(0);
  });

  it('returns a small positive distance for nearby points', () => {
    const a = { latitude: 22.5726, longitude: 88.3639 };
    const b = { latitude: 22.5736, longitude: 88.3639 };
    const distance = haversineDistanceKm(a, b);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(0.2);
  });

  it('matches a known coordinate pair within a small tolerance', () => {
    // Kolkata (~22.5726, 88.3639) to Salt Lake (~22.5958, 88.4497) is ~9.6 km straight-line.
    const kolkata = { latitude: 22.5726, longitude: 88.3639 };
    const saltLake = { latitude: 22.5958, longitude: 88.4497 };
    const distance = haversineDistanceKm(kolkata, saltLake);
    expect(distance).toBeGreaterThan(8.5);
    expect(distance).toBeLessThan(10.5);
  });

  it('is symmetric', () => {
    const a = { latitude: 22.5726, longitude: 88.3639 };
    const b = { latitude: 22.5958, longitude: 88.4497 };
    expect(haversineDistanceKm(a, b)).toBeCloseTo(haversineDistanceKm(b, a), 10);
  });
});

describe('cumulativeDistanceKm', () => {
  it('starts at 0', () => {
    const coords = [
      { latitude: 22.5726, longitude: 88.3639 },
      { latitude: 22.58, longitude: 88.37 },
    ];
    expect(cumulativeDistanceKm(coords)[0]).toBe(0);
  });

  it('is monotonically increasing across multiple segments', () => {
    const coords = [
      { latitude: 22.5726, longitude: 88.3639 },
      { latitude: 22.58, longitude: 88.37 },
      { latitude: 22.59, longitude: 88.38 },
      { latitude: 22.6, longitude: 88.39 },
    ];
    const cumulative = cumulativeDistanceKm(coords);
    for (let i = 1; i < cumulative.length; i += 1) {
      expect(cumulative[i]).toBeGreaterThan(cumulative[i - 1]);
    }
  });

  it('handles a single coordinate', () => {
    const coords = [{ latitude: 22.5726, longitude: 88.3639 }];
    expect(cumulativeDistanceKm(coords)).toEqual([0]);
  });
});
