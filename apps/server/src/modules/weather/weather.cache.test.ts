import { buildCacheKey, TTLCache } from './weather.cache';

describe('TTLCache', () => {
  it('returns undefined for a missing key', () => {
    const cache = new TTLCache<string>(1000);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('returns a stored value before it expires', () => {
    const cache = new TTLCache<string>(1000);
    cache.set('key', 'value');
    expect(cache.get('key')).toBe('value');
  });

  it('returns undefined once the TTL has elapsed', () => {
    jest.useFakeTimers();
    try {
      const cache = new TTLCache<string>(1000);
      cache.set('key', 'value');
      jest.advanceTimersByTime(1001);
      expect(cache.get('key')).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('buildCacheKey', () => {
  it('produces different keys for different coordinates', () => {
    const a = buildCacheKey({ latitude: 22.5726, longitude: 88.3639 });
    const b = buildCacheKey({ latitude: 12.9716, longitude: 77.5946 });
    expect(a).not.toBe(b);
  });

  it('produces different keys for different options at the same coordinates', () => {
    const point = { latitude: 22.5726, longitude: 88.3639 };
    const a = buildCacheKey(point, { hours: 24 });
    const b = buildCacheKey(point, { hours: 48 });
    expect(a).not.toBe(b);
  });

  it('produces the same key for identical coordinates and options', () => {
    const point = { latitude: 22.5726, longitude: 88.3639 };
    expect(buildCacheKey(point, { hours: 24 })).toBe(buildCacheKey(point, { hours: 24 }));
  });
});
