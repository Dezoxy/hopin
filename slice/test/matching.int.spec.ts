import { Pool } from 'pg';
import Redis from 'ioredis';
import { MatchingService } from '../src/matching/matching.service';
import { RidesService } from '../src/rides/rides.service';
import type { RealtimeBus } from '../src/realtime/realtime.bus';
import { BUDAPEST, resetState, testConfig } from './helpers';

const config = testConfig();
let pool: Pool;
let redis: Redis;
let matching: MatchingService;
let rides: RidesService;
const offers: Array<{ tenantId: string; driverId: string; rideId: string }> = [];

beforeAll(() => {
  pool = new Pool({ connectionString: config.databaseUrl });
  redis = new Redis(config.redisUrl);
  rides = new RidesService(pool);
  const bus = {
    toDriver: (tenantId: string, driverId: string, _e: string, p: { rideId: string }) =>
      offers.push({ tenantId, driverId, rideId: p.rideId }),
    toRide: () => undefined,
  } as unknown as RealtimeBus;
  matching = new MatchingService(redis, rides, bus);
});
beforeEach(async () => {
  offers.length = 0;
  await resetState(config);
});
afterAll(async () => {
  await matching.onModuleDestroy();
  redis.disconnect();
  await pool.end();
});

it('ignores an accept from a same-named driver in another tenant and keeps the offer alive', async () => {
  // Arrange: tenant-a driver d1 is offered a tenant-a ride
  await matching.recordLocation('tenant-a', 'd1', BUDAPEST);
  const { rideId } = await rides.requestRide('tenant-a', 'p1', BUDAPEST);
  await matching.dispatch({ tenantId: 'tenant-a', rideId, pickup: BUDAPEST });
  expect(offers).toEqual([{ tenantId: 'tenant-a', driverId: 'd1', rideId }]);

  // Act: a tenant-b driver who is also called d1 tries to accept it, then the real driver does
  const foreign = await matching.accept('tenant-b', 'd1', rideId);
  const real = await matching.accept('tenant-a', 'd1', rideId);

  // Assert
  expect(foreign).toBe(false);
  expect(real).toBe(true);
  expect((await rides.getRide('tenant-a', rideId))?.state).toBe('MATCHED');
});
