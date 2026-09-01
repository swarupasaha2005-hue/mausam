import { LocationError } from '@cloud6/shared';
import { GeocodingService } from './geocodingService';
import type { GeocodingProvider } from './geocodingProvider';

const COORDINATES = { latitude: 22.5726, longitude: 88.3639 };

describe('GeocodingService', () => {
  it('returns the human-readable location on success', async () => {
    const provider: GeocodingProvider = {
      reverseGeocode: jest.fn().mockResolvedValue({ city: 'Kolkata', state: 'West Bengal' }),
      geocode: jest.fn(),
    };
    const service = new GeocodingService(provider);

    await expect(service.reverseGeocode(COORDINATES)).resolves.toEqual({
      city: 'Kolkata',
      state: 'West Bengal',
    });
  });

  it('normalizes a provider failure into GEOCODING_FAILED', async () => {
    const provider: GeocodingProvider = {
      reverseGeocode: jest.fn().mockRejectedValue(new Error('network error')),
      geocode: jest.fn(),
    };
    const service = new GeocodingService(provider);

    await expect(service.reverseGeocode(COORDINATES)).rejects.toBeInstanceOf(LocationError);
    await expect(service.reverseGeocode(COORDINATES)).rejects.toMatchObject({
      code: 'GEOCODING_FAILED',
    });
  });

  it('passes through an empty/partial result rather than failing', async () => {
    const provider: GeocodingProvider = {
      reverseGeocode: jest.fn().mockResolvedValue({}),
      geocode: jest.fn(),
    };
    const service = new GeocodingService(provider);

    await expect(service.reverseGeocode(COORDINATES)).resolves.toEqual({});
  });
});

describe('GeocodingService.geocode', () => {
  it('returns candidate coordinates for a successful text search', async () => {
    const provider: GeocodingProvider = {
      reverseGeocode: jest.fn(),
      geocode: jest.fn().mockResolvedValue([{ latitude: 22.5958, longitude: 88.4497 }]),
    };
    const service = new GeocodingService(provider);

    await expect(service.geocode('Salt Lake, Kolkata')).resolves.toEqual([
      { latitude: 22.5958, longitude: 88.4497 },
    ]);
  });

  it('normalizes a provider failure into GEOCODING_FAILED', async () => {
    const provider: GeocodingProvider = {
      reverseGeocode: jest.fn(),
      geocode: jest.fn().mockRejectedValue(new Error('network error')),
    };
    const service = new GeocodingService(provider);

    await expect(service.geocode('nowhere')).rejects.toMatchObject({ code: 'GEOCODING_FAILED' });
  });

  it('returns an empty array when nothing matches', async () => {
    const provider: GeocodingProvider = {
      reverseGeocode: jest.fn(),
      geocode: jest.fn().mockResolvedValue([]),
    };
    const service = new GeocodingService(provider);

    await expect(service.geocode('')).resolves.toEqual([]);
  });
});
