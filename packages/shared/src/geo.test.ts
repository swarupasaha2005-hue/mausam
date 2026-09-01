import { isValidGeoPoint, type GeoPoint } from './geo';

describe('isValidGeoPoint', () => {
  it('accepts (0, 0)', () => {
    expect(isValidGeoPoint({ latitude: 0, longitude: 0 })).toBe(true);
  });

  it('accepts the max edge (90, 180)', () => {
    expect(isValidGeoPoint({ latitude: 90, longitude: 180 })).toBe(true);
  });

  it('accepts the min edge (-90, -180)', () => {
    expect(isValidGeoPoint({ latitude: -90, longitude: -180 })).toBe(true);
  });

  it('rejects latitude above 90', () => {
    expect(isValidGeoPoint({ latitude: 91, longitude: 0 })).toBe(false);
  });

  it('rejects latitude below -90', () => {
    expect(isValidGeoPoint({ latitude: -91, longitude: 0 })).toBe(false);
  });

  it('rejects longitude above 180', () => {
    expect(isValidGeoPoint({ latitude: 0, longitude: 181 })).toBe(false);
  });

  it('rejects longitude below -180', () => {
    expect(isValidGeoPoint({ latitude: 0, longitude: -181 })).toBe(false);
  });

  it('rejects NaN values', () => {
    expect(isValidGeoPoint({ latitude: NaN, longitude: 0 })).toBe(false);
    expect(isValidGeoPoint({ latitude: 0, longitude: NaN })).toBe(false);
  });

  it('rejects non-finite values', () => {
    expect(isValidGeoPoint({ latitude: Infinity, longitude: 0 })).toBe(false);
    expect(isValidGeoPoint({ latitude: 0, longitude: -Infinity })).toBe(false);
  });

  it('rejects missing values passed through untyped input', () => {
    const malformed = { latitude: 12.3 } as GeoPoint;
    expect(isValidGeoPoint(malformed)).toBe(false);
  });

  it('rejects non-numeric values passed through untyped input', () => {
    const malformed = { latitude: '12.3', longitude: 45 } as unknown as GeoPoint;
    expect(isValidGeoPoint(malformed)).toBe(false);
  });
});
