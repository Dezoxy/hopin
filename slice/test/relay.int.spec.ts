import { Pool } from 'pg';
import { RidesService } from '../src/rides/rides.service';
import { OutboxRelay } from '../src/outbox/outbox.relay';
import { RealtimeBus } from '../src/realtime/realtime.bus';
import { resetState, testConfig } from './helpers';

const config = testConfig();
let pool: Pool;

beforeAll(() => {
  pool = new Pool({ connectionString: config.databaseUrl });
});
beforeEach(() => resetState(config));
afterAll(() => pool.end());

describe('OutboxRelay', () => {
  it('publishes a committed entry once and marks it published', async () => {
    const rides = new RidesService(pool);
    const sent: Array<{ rideId: string; event: string }> = [];
    const bus = { toRide: (_t: string, rideId: string, event: string) => sent.push({ rideId, event }) } as unknown as RealtimeBus;
    const relay = new OutboxRelay(pool, bus);
    const { rideId } = await rides.requestRide('tenant-a', 'p1', { lat: 47.5, lng: 19.05 });
    await rides.acceptRide('tenant-a', rideId, 'd1');

    const firstTick = await relay.tickOnce();
    const secondTick = await relay.tickOnce();

    expect(firstTick).toBe(1);
    expect(secondTick).toBe(0);
    expect(sent).toEqual([{ rideId, event: 'ride.state' }]);
  });
});
