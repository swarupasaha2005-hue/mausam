import { LocationError } from '@cloud6/shared';
import { GeocodingService } from './geocoding.service';
import type { GeocodingProvider } from './geocoding.types';

function createProvider(overrides: Partial<GeocodingProvider> = {}): GeocodingProvider {
  return {
    geocode: jest.fn().mockResolvedValue([{ latitude: 22.56263, longitude: 88.36304 }]),
    ...overrides,
  };
}

describe('GeocodingService.geocode', () => {
  it('returns the provider results for a valid query', async () => {
    const provider = createProvider();
    const service = new GeocodingService(provider);

    const result = await service.geocode('Kolkata');

    expect(provider.geocode).toHaveBeenCalledWith('Kolkata');
    expect(result).toEqual([{ latitude: 22.56263, longitude: 88.36304 }]);
  });

  it('trims the query before passing it to the provider', async () => {
    const provider = createProvider();
    const service = new GeocodingService(provider);

    await service.geocode('  Kolkata  ');

    expect(provider.geocode).toHaveBeenCalledWith('Kolkata');
  });

  it('throws GEOCODING_FAILED for an empty query without calling the provider', async () => {
    const provider = createProvider();
    const service = new GeocodingService(provider);

    await expect(service.geocode('   ')).rejects.toMatchObject({ code: 'GEOCODING_FAILED' });
    expect(provider.geocode).not.toHaveBeenCalled();
  });

  it('normalizes a provider failure into a LocationError', async () => {
    const provider = createProvider({ geocode: jest.fn().mockRejectedValue(new Error('network down')) });
    const service = new GeocodingService(provider);

    await expect(service.geocode('Kolkata')).rejects.toBeInstanceOf(LocationError);
    await expect(service.geocode('Kolkata')).rejects.toMatchObject({ code: 'GEOCODING_FAILED' });
  });

  it('passes through an existing LocationError from the provider unchanged', async () => {
    const providerError = new LocationError('GEOCODING_FAILED', 'provider timeout');
    const provider = createProvider({ geocode: jest.fn().mockRejectedValue(providerError) });
    const service = new GeocodingService(provider);

    await expect(service.geocode('Kolkata')).rejects.toBe(providerError);
  });
});

describe('GeocodingService.geocode — compound-query fallback', () => {
  // Kolkata city center.
  const KOLKATA = { latitude: 22.56263, longitude: 88.36304 };
  // Real "Salt Lake" neighborhood in Kolkata — ~4km from KOLKATA.
  const SALT_LAKE_KOLKATA = { latitude: 22.58333, longitude: 88.41667 };
  // "Salt Lake" the unrelated city in Utah — thousands of km from KOLKATA.
  const SALT_LAKE_UTAH = { latitude: 40.76078, longitude: -111.89105 };

  it('falls back to a nearby specific-part match when the exact compound query fails', async () => {
    const geocode = jest.fn(async (query: string) => {
      if (query === 'Salt Lake, Kolkata') return [];
      if (query === 'Kolkata') return [KOLKATA];
      if (query === 'Salt Lake') return [SALT_LAKE_UTAH, SALT_LAKE_KOLKATA];
      return [];
    });
    const service = new GeocodingService({ geocode });

    const result = await service.geocode('Salt Lake, Kolkata');

    expect(result).toEqual([SALT_LAKE_KOLKATA]);
  });

  it('returns no match when the closest specific-part candidate is implausibly far from the anchor', async () => {
    const geocode = jest.fn(async (query: string) => {
      if (query === 'Salt Lake, Nowhereville') return [];
      if (query === 'Nowhereville') return [];
      return [];
    });
    const service = new GeocodingService({ geocode });

    // Anchor itself fails to resolve — nothing to disambiguate against.
    await expect(service.geocode('Salt Lake, Nowhereville')).resolves.toEqual([]);
  });

  it('returns no match when only the far candidate exists (no plausible nearby match)', async () => {
    const geocode = jest.fn(async (query: string) => {
      if (query === 'Salt Lake, Kolkata') return [];
      if (query === 'Kolkata') return [KOLKATA];
      if (query === 'Salt Lake') return [SALT_LAKE_UTAH];
      return [];
    });
    const service = new GeocodingService({ geocode });

    await expect(service.geocode('Salt Lake, Kolkata')).resolves.toEqual([]);
  });

  it('returns no match when the specific part has no results at all, rather than guessing the anchor', async () => {
    const geocode = jest.fn(async (query: string) => {
      if (query === 'Xyzzy, Kolkata') return [];
      if (query === 'Kolkata') return [KOLKATA];
      if (query === 'Xyzzy') return [];
      return [];
    });
    const service = new GeocodingService({ geocode });

    await expect(service.geocode('Xyzzy, Kolkata')).resolves.toEqual([]);
  });

  it('does not attempt a fallback for a single-word query that has no comma to split on', async () => {
    const geocode = jest.fn().mockResolvedValue([]);
    const service = new GeocodingService({ geocode });

    await expect(service.geocode('Nowhereatall')).resolves.toEqual([]);
    expect(geocode).toHaveBeenCalledTimes(1);
  });
});
