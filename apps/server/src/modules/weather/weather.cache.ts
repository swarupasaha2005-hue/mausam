import type { GeoPoint } from '@cloud6/shared';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Minimal in-memory TTL cache. Kept behind WeatherService so it can be
 * swapped for a real cache (Redis, etc.) later without touching callers.
 */
export class TTLCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

/** Cache key that accounts for coordinates plus any request-shaping options. */
export function buildCacheKey(point: GeoPoint, options?: object): string {
  const lat = point.latitude.toFixed(4);
  const lon = point.longitude.toFixed(4);
  const optionsKey = options ? JSON.stringify(options) : '';
  return `${lat},${lon}:${optionsKey}`;
}
