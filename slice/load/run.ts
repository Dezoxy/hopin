/**
 * Load test for the slice (plan step S123). Measures:
 * - QA-01 offer latency: ride request sent -> offer received by a driver (target p95 < 2 s)
 * - QA-02 position staleness: age of the newest driver position on the passenger's
 *   screen, sampled every 250 ms (target <= 3 s)
 * Run against a started API: BASE_URL=http://localhost:3000 pnpm load
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { io, type Socket } from 'socket.io-client';

const num = (name: string, fallback: number): number => Number(process.env[name] ?? fallback);
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const DRIVERS = num('DRIVERS', 200);
const RIDES_PER_MIN = num('RIDES_PER_MIN', 50);
const DURATION_S = num('DURATION_S', 180);
const LOCATION_EVERY_MS = 3000;
const SAMPLE_EVERY_MS = 250;
const WATCH_AFTER_MATCH_MS = 30_000;
const TENANTS = ['tenant-a', 'tenant-b'] as const;
const CENTER = { lat: 47.4979, lng: 19.054 };
const SPREAD_DEG = 0.06; // about 6 km

const offerLatency: number[] = [];
const staleness: number[] = [];
const transport: number[] = [];
const sentAt = new Map<string, number>();
const sockets: Socket[] = [];
let requests = 0, httpErrors = 0, offers = 0, accepted = 0, noDriver = 0;

const rand = (spread: number): number => (Math.random() - 0.5) * spread;
const pct = (xs: number[], p: number): number => {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] ?? NaN;
};
const summary = (xs: number[]) => ({
  n: xs.length, p50: pct(xs, 50), p95: pct(xs, 95), p99: pct(xs, 99), max: xs.length ? Math.max(...xs) : NaN,
});
const connect = (ns: string, auth: Record<string, string>): Promise<Socket> =>
  new Promise((resolve, reject) => {
    const s = io(`${BASE_URL}/${ns}`, { auth, transports: ['websocket'], forceNew: true });
    sockets.push(s);
    s.once('connect', () => resolve(s));
    s.once('connect_error', reject);
  });

async function startDriver(i: number): Promise<void> {
  const tenantId = TENANTS[i % TENANTS.length]!;
  const s = await connect('driver', { tenantId, driverId: `d${i}` });
  let pos = { lat: CENTER.lat + rand(SPREAD_DEG), lng: CENTER.lng + rand(SPREAD_DEG) };
  const report = (): void => {
    pos = { lat: pos.lat + rand(0.0005), lng: pos.lng + rand(0.0005) };
    s.emit('location', { ...pos, recordedAt: Date.now() });
  };
  report();
  setTimeout(() => setInterval(report, LOCATION_EVERY_MS), Math.random() * LOCATION_EVERY_MS);
  s.on('offer.new', async ({ rideId }: { rideId: string }) => {
    offers++;
    const t0 = sentAt.get(rideId);
    if (t0 !== undefined) offerLatency.push(Date.now() - t0);
    const ack = (await s.emitWithAck('offer.accept', { rideId })) as { ok: boolean };
    if (ack.ok) accepted++;
  });
}

async function requestRide(n: number): Promise<void> {
  const tenantId = TENANTS[n % TENANTS.length]!;
  const passengerId = `p${n}`;
  const pickup = { lat: CENTER.lat + rand(SPREAD_DEG * 0.8), lng: CENTER.lng + rand(SPREAD_DEG * 0.8) };
  const t0 = Date.now();
  requests++;
  const res = await fetch(`${BASE_URL}/v1/rides`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-tenant-id': tenantId, 'x-passenger-id': passengerId },
    body: JSON.stringify(pickup),
  }).catch(() => undefined);
  if (!res || res.status !== 201) {
    httpErrors++;
    return;
  }
  const { rideId } = (await res.json()) as { rideId: string };
  sentAt.set(rideId, t0);
  const p = await connect('passenger', { tenantId, passengerId });
  let lastRecordedAt: number | undefined;
  p.on('driver.position', ({ recordedAt }: { recordedAt: number }) => {
    transport.push(Date.now() - recordedAt);
    lastRecordedAt = recordedAt;
  });
  p.on('ride.state', ({ state }: { state: string }) => {
    if (state === 'NO_DRIVER') noDriver++;
  });
  await p.emitWithAck('ride.watch', { rideId });
  const sampler = setInterval(() => {
    if (lastRecordedAt !== undefined) staleness.push(Date.now() - lastRecordedAt);
  }, SAMPLE_EVERY_MS);
  setTimeout(() => clearInterval(sampler), WATCH_AFTER_MATCH_MS);
}

async function main(): Promise<void> {
  console.log(`drivers=${DRIVERS} rides/min=${RIDES_PER_MIN} duration=${DURATION_S}s against ${BASE_URL}`);
  for (let i = 0; i < DRIVERS; i++) await startDriver(i);
  await new Promise((r) => setTimeout(r, LOCATION_EVERY_MS + 500)); // every driver has reported once
  const total = Math.round((RIDES_PER_MIN * DURATION_S) / 60);
  const gap = 60_000 / RIDES_PER_MIN;
  for (let n = 0; n < total; n++) {
    requestRide(n).catch((err: unknown) => {
      httpErrors++;
      console.error(`ride ${n} failed`, err);
    });
    await new Promise((r) => setTimeout(r, gap));
  }
  await new Promise((r) => setTimeout(r, WATCH_AFTER_MATCH_MS + 1000));
  const result = {
    at: new Date().toISOString(),
    config: { DRIVERS, RIDES_PER_MIN, DURATION_S, LOCATION_EVERY_MS, SAMPLE_EVERY_MS },
    counts: { requests, httpErrors, offers, accepted, noDriver },
    offerLatencyMs: summary(offerLatency),
    positionStalenessMs: summary(staleness),
    positionTransportMs: summary(transport),
  };
  mkdirSync('load/results', { recursive: true });
  writeFileSync(`load/results/${result.at.replace(/[:.]/g, '-')}.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  sockets.forEach((s) => s.disconnect());
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error('load test failed', err);
  process.exit(1);
});
