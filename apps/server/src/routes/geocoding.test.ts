import request from 'supertest';
import { LocationError } from '@cloud6/shared';

jest.mock('../modules/geocoding/geocoding.service', () => ({
  geocodingService: { geocode: jest.fn() },
}));

import { app } from '../app';
import { geocodingService } from '../modules/geocoding/geocoding.service';

const mockedGeocodingService = jest.mocked(geocodingService);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/geocoding', () => {
  it('returns geocoded results for a valid query', async () => {
    mockedGeocodingService.geocode.mockResolvedValue([{ latitude: 22.56263, longitude: 88.36304 }]);

    const response = await request(app).get('/api/geocoding').query({ query: 'Kolkata' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ results: [{ latitude: 22.56263, longitude: 88.36304 }] });
    expect(mockedGeocodingService.geocode).toHaveBeenCalledWith('Kolkata');
  });

  it('returns 400 when query is missing', async () => {
    const response = await request(app).get('/api/geocoding');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('GEOCODING_FAILED');
    expect(mockedGeocodingService.geocode).not.toHaveBeenCalled();
  });

  it('returns 400 when query is blank', async () => {
    const response = await request(app).get('/api/geocoding').query({ query: '   ' });

    expect(response.status).toBe(400);
    expect(mockedGeocodingService.geocode).not.toHaveBeenCalled();
  });

  it('normalizes a provider failure into a 502 GEOCODING_FAILED response', async () => {
    mockedGeocodingService.geocode.mockRejectedValue(new LocationError('GEOCODING_FAILED', 'boom'));

    const response = await request(app).get('/api/geocoding').query({ query: 'Nowhereland' });

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('GEOCODING_FAILED');
  });

  it('returns an empty results array when nothing matches', async () => {
    mockedGeocodingService.geocode.mockResolvedValue([]);

    const response = await request(app).get('/api/geocoding').query({ query: 'asdkfjaslkdjf' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ results: [] });
  });
});
