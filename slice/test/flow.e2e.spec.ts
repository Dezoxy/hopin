import type { INestApplication } from '@nestjs/common';
import { io, type Socket } from 'socket.io-client';
import { BUDAPEST, resetState, startApp, testConfig } from './helpers';

const config = testConfig();
let app: INestApplication;
let url: string;
const sockets: Socket[] = [];

function connect(ns: string, auth: Record<string, string>): Promise<Socket> {
  const s = io(`${url}/${ns}`, { auth, transports: ['websocket'], forceNew: true });
  sockets.push(s);
  return new Promise((resolve, reject) => {
    s.once('connect', () => resolve(s));
    s.once('connect_error', reject);
  });
}
const next = <T>(s: Socket, event: string, ms = 3000): Promise<T> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), ms);
    s.once(event, (p: T) => { clearTimeout(t); resolve(p); });
  });

beforeAll(async () => {
  await resetState(config);
  ({ app, url } = await startApp(config));
});
afterAll(async () => {
  sockets.forEach((s) => s.disconnect());
  await app.close();
});

it('requests a ride, offers it to the nearest driver, matches it and streams the position', async () => {
  // Arrange: one online driver 300 m from the pickup
  const driver = await connect('driver', { tenantId: 'tenant-a', driverId: 'd1' });
  await driver.emitWithAck('location', { lat: BUDAPEST.lat + 0.0027, lng: BUDAPEST.lng, recordedAt: Date.now() });

  // Act: passenger requests a ride
  const sentAt = Date.now();
  const offer = next<{ rideId: string }>(driver, 'offer.new');
  const res = await fetch(`${url}/v1/rides`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-a', 'x-passenger-id': 'p1' },
    body: JSON.stringify(BUDAPEST),
  });
  const { rideId } = (await res.json()) as { rideId: string };
  const received = await offer;

  // Assert: offer arrives within QA-01's 2 s target
  expect(res.status).toBe(201);
  expect(received.rideId).toBe(rideId);
  expect(Date.now() - sentAt).toBeLessThan(2000);

  const passenger = await connect('passenger', { tenantId: 'tenant-a', passengerId: 'p1' });
  expect(await passenger.emitWithAck('ride.watch', { rideId })).toEqual({ ok: true });
  const matched = next<{ state: string; driverId: string }>(passenger, 'ride.state');
  expect(await driver.emitWithAck('offer.accept', { rideId })).toEqual({ ok: true });
  expect(await matched).toMatchObject({ state: 'MATCHED', driverId: 'd1' });

  const position = next<{ recordedAt: number }>(passenger, 'driver.position');
  const recordedAt = Date.now();
  await driver.emitWithAck('location', { lat: BUDAPEST.lat + 0.001, lng: BUDAPEST.lng, recordedAt });
  expect((await position).recordedAt).toBe(recordedAt);
});

it('rejects a passenger watching a ride of another tenant', async () => {
  const passenger = await connect('passenger', { tenantId: 'tenant-b', passengerId: 'p1' });
  const res = await fetch(`${url}/v1/rides`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-a', 'x-passenger-id': 'p1' },
    body: JSON.stringify(BUDAPEST),
  });
  const { rideId } = (await res.json()) as { rideId: string };

  expect(await passenger.emitWithAck('ride.watch', { rideId })).toEqual({ ok: false });
});

it('rejects a ride request without identity headers', async () => {
  const res = await fetch(`${url}/v1/rides`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(BUDAPEST),
  });
  expect(res.status).toBe(401);
});
