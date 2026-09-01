import request from 'supertest';
import { RouteError } from '@cloud6/shared';
import { cloud6RouteFixture } from '../../test/fixtures/cloud6/route';

jest.mock('../modules/routing/routing.service', () => ({
  routingService: { getRoute: jest.fn() },
}));

import { app } from '../app';
import { routingService } from '../modules/routing/routing.service';

const mockedRoutingService = jest.mocked(routingService);

beforeEach(() => {
  jest.clearAllMocks();
});

const VALID_QUERY = {
  startLatitude: '22.5726',
  startLongitude: '88.3639',
  destinationLatitude: '22.5958',
  destinationLongitude: '88.4497',
};

describe('GET /api/routes', () => {
  it('returns normalized CLOUD6 Route data for a valid request', async () => {
    mockedRoutingService.getRoute.mockResolvedValue(cloud6RouteFixture);

    const response = await request(app).get('/api/routes').query(VALID_QUERY);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(cloud6RouteFixture);
  });

  it('does not leak raw OSRM field names', async () => {
    mockedRoutingService.getRoute.mockResolvedValue(cloud6RouteFixture);

    const response = await request(app).get('/api/routes').query(VALID_QUERY);

    const raw = JSON.stringify(response.body);
    expect(raw).not.toContain('geometry');
    expect(raw).not.toContain('"distance"');
  });

  it('returns 400 for a missing start coordinate', async () => {
    const response = await request(app)
      .get('/api/routes')
      .query({ ...VALID_QUERY, startLatitude: undefined });

    expect(mockedRoutingService.getRoute).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('ROUTE_INVALID_COORDINATES');
  });

  it('returns 400 for a missing destination coordinate', async () => {
    const response = await request(app)
      .get('/api/routes')
      .query({ ...VALID_QUERY, destinationLongitude: undefined });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('ROUTE_INVALID_COORDINATES');
  });

  it('returns 400 for an invalid latitude', async () => {
    const response = await request(app)
      .get('/api/routes')
      .query({ ...VALID_QUERY, startLatitude: '999' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('ROUTE_INVALID_COORDINATES');
  });

  it('returns 400 for an invalid longitude', async () => {
    const response = await request(app)
      .get('/api/routes')
      .query({ ...VALID_QUERY, destinationLongitude: '999' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('ROUTE_INVALID_COORDINATES');
  });

  it('maps a provider failure to a 502', async () => {
    mockedRoutingService.getRoute.mockRejectedValue(new RouteError('ROUTE_PROVIDER_ERROR'));

    const response = await request(app).get('/api/routes').query(VALID_QUERY);

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('ROUTE_PROVIDER_ERROR');
  });

  it('maps a not-found route to a 404', async () => {
    mockedRoutingService.getRoute.mockRejectedValue(new RouteError('ROUTE_NOT_FOUND'));

    const response = await request(app).get('/api/routes').query(VALID_QUERY);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
