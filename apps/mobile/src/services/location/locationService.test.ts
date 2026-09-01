import { LocationError, type GeoPoint } from '@cloud6/shared';
import { LocationService } from './locationService';
import type { DeviceLocationProvider } from './deviceLocationProvider';

function createProvider(overrides: Partial<DeviceLocationProvider> = {}): DeviceLocationProvider {
  return {
    checkPermission: jest.fn().mockResolvedValue('granted'),
    requestPermission: jest.fn().mockResolvedValue('granted'),
    isLocationEnabled: jest.fn().mockResolvedValue(true),
    getCurrentPosition: jest.fn().mockResolvedValue({ latitude: 22.5726, longitude: 88.3639 }),
    ...overrides,
  };
}

describe('LocationService', () => {
  describe('checkPermission / requestPermission', () => {
    it('passes through the provider permission status already granted', async () => {
      const provider = createProvider({ checkPermission: jest.fn().mockResolvedValue('granted') });
      const service = new LocationService(provider);
      await expect(service.checkPermission()).resolves.toBe('granted');
    });

    it('passes through undetermined status when not yet requested', async () => {
      const provider = createProvider({
        checkPermission: jest.fn().mockResolvedValue('undetermined'),
      });
      const service = new LocationService(provider);
      await expect(service.checkPermission()).resolves.toBe('undetermined');
    });

    it('passes through denied status', async () => {
      const provider = createProvider({ checkPermission: jest.fn().mockResolvedValue('denied') });
      const service = new LocationService(provider);
      await expect(service.checkPermission()).resolves.toBe('denied');
    });

    it('returns granted when a permission request succeeds', async () => {
      const provider = createProvider({
        requestPermission: jest.fn().mockResolvedValue('granted'),
      });
      const service = new LocationService(provider);
      await expect(service.requestPermission()).resolves.toBe('granted');
    });

    it('returns denied when a permission request is rejected by the user', async () => {
      const provider = createProvider({
        requestPermission: jest.fn().mockResolvedValue('denied'),
      });
      const service = new LocationService(provider);
      await expect(service.requestPermission()).resolves.toBe('denied');
    });

    it('returns restricted when permission cannot be determined/re-asked', async () => {
      const provider = createProvider({
        requestPermission: jest.fn().mockResolvedValue('restricted'),
      });
      const service = new LocationService(provider);
      await expect(service.requestPermission()).resolves.toBe('restricted');
    });
  });

  describe('getCurrentLocation', () => {
    it('returns normalized coordinates on success', async () => {
      const provider = createProvider({
        getCurrentPosition: jest.fn().mockResolvedValue({ latitude: 12.34, longitude: 56.78 }),
      });
      const service = new LocationService(provider);
      const result = await service.getCurrentLocation();
      expect(result).toEqual<GeoPoint>({ latitude: 12.34, longitude: 56.78 });
    });

    it('throws LOCATION_PERMISSION_DENIED when permission is not granted', async () => {
      const provider = createProvider({ checkPermission: jest.fn().mockResolvedValue('denied') });
      const service = new LocationService(provider);
      await expect(service.getCurrentLocation()).rejects.toMatchObject({
        code: 'LOCATION_PERMISSION_DENIED',
      });
      expect(provider.getCurrentPosition).not.toHaveBeenCalled();
    });

    it('throws LOCATION_UNAVAILABLE when location services are disabled', async () => {
      const provider = createProvider({ isLocationEnabled: jest.fn().mockResolvedValue(false) });
      const service = new LocationService(provider);
      await expect(service.getCurrentLocation()).rejects.toMatchObject({
        code: 'LOCATION_UNAVAILABLE',
      });
    });

    it('normalizes a provider failure into LOCATION_TIMEOUT without leaking the raw error', async () => {
      const provider = createProvider({
        getCurrentPosition: jest.fn().mockRejectedValue(new Error('native GPS timeout')),
      });
      const service = new LocationService(provider);

      await expect(service.getCurrentLocation()).rejects.toBeInstanceOf(LocationError);
      await expect(service.getCurrentLocation()).rejects.toMatchObject({
        code: 'LOCATION_TIMEOUT',
      });
    });

    it('throws LOCATION_INVALID for a malformed/out-of-range provider response', async () => {
      const provider = createProvider({
        getCurrentPosition: jest.fn().mockResolvedValue({ latitude: 999, longitude: 0 }),
      });
      const service = new LocationService(provider);
      await expect(service.getCurrentLocation()).rejects.toMatchObject({
        code: 'LOCATION_INVALID',
      });
    });

    it('does not throw for the application — rejects with a LocationError instead of crashing', async () => {
      const provider = createProvider({
        getCurrentPosition: jest.fn().mockRejectedValue('unexpected non-Error rejection'),
      });
      const service = new LocationService(provider);
      await expect(service.getCurrentLocation()).rejects.toBeInstanceOf(LocationError);
    });
  });
});
