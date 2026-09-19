import { Pool } from 'pg';
import { RidesService } from '../src/rides/rides.service';
import { resetState, testConfig } from './helpers';

const config = testConfig();
let pool: Pool;
let rides: RidesService;

beforeAll(() => {
  pool = new Pool({ connectionString: config.databaseUrl });
  rides = new RidesService(pool);
});
beforeEach(() => resetState(config));
afterAll(() => pool.end());

describe('RidesService', () => {
  it('stores a requested ride with its ride event', async () => {
    const { rideId } = await rides.requestRide('tenant-a', 'p1', { lat: 47.5, lng: 19.05 });

    const ride = await rides.getRide('tenant-a', rideId);
    expect(ride?.state).toBe('REQUESTED');
    const events = await rides.eventsFor('tenant-a', rideId);
    expect(events.map((e) => e.type)).toEqual(['requested']);
  });

  it('matches a ride once and writes exactly one outbox entry', async () => {
    const { rideId } = await rides.requestRide('tenant-a', 'p1', { lat: 47.5, lng: 19.05 });

    const first = await rides.acceptRide('tenant-a', rideId, 'd1');
    const second = await rides.acceptRide('tenant-a', rideId, 'd2');

    expect(first).toBe(true);
    expect(second).toBe(false);
    const ride = await rides.getRide('tenant-a', rideId);
    expect(ride).toMatchObject({ state: 'MATCHED', driverId: 'd1' });
    const outbox = await pool.query("SELECT type, payload FROM outbox WHERE payload->>'rideId' = $1", [rideId]);
    expect(outbox.rows).toEqual([{ type: 'ride.matched', payload: { rideId, driverId: 'd1' } }]);
  });

  it('hides a ride from another tenant (row-level security)', async () => {
    const { rideId } = await rides.requestRide('tenant-a', 'p1', { lat: 47.5, lng: 19.05 });

    expect(await rides.getRide('tenant-b', rideId)).toBeNull();
    expect(await rides.acceptRide('tenant-b', rideId, 'd9')).toBe(false);
  });

  it('returns no rows when no tenant is set, instead of all rows', async () => {
    await rides.requestRide('tenant-a', 'p1', { lat: 47.5, lng: 19.05 });

    const unscoped = await pool.query('SELECT id FROM rides');
    expect(unscoped.rowCount).toBe(0);
  });
});
