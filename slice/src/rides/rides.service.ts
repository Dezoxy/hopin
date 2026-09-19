import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import type { LatLng } from '../domain/geo';
import type { RideState } from '../domain/ride-state';
import { withTenant } from '../db/tx';
import { PG_POOL } from '../tokens';

export interface Ride {
  readonly id: string;
  readonly tenantId: string;
  readonly passengerId: string;
  readonly driverId: string | null;
  readonly state: RideState;
  readonly pickup: LatLng;
}

interface RideRow {
  id: string;
  tenant_id: string;
  passenger_id: string;
  driver_id: string | null;
  state: RideState;
  pickup_lat: number;
  pickup_lng: number;
}

const toRide = (r: RideRow): Ride => ({
  id: r.id,
  tenantId: r.tenant_id,
  passengerId: r.passenger_id,
  driverId: r.driver_id,
  state: r.state,
  pickup: { lat: r.pickup_lat, lng: r.pickup_lng },
});

/** Ride Lifecycle component: every state change and its ride event commit together. */
@Injectable()
export class RidesService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  requestRide(tenantId: string, passengerId: string, pickup: LatLng): Promise<{ rideId: string }> {
    const rideId = randomUUID();
    return withTenant(this.pool, tenantId, async (c) => {
      await c.query(
        `INSERT INTO rides (id, tenant_id, passenger_id, state, pickup_lat, pickup_lng)
         VALUES ($1, $2, $3, 'REQUESTED', $4, $5)`,
        [rideId, tenantId, passengerId, pickup.lat, pickup.lng],
      );
      await this.appendEvent(c, tenantId, rideId, 'requested', passengerId);
      return { rideId };
    });
  }

  /**
   * REQUESTED -> MATCHED. The WHERE clause makes the transition atomic, so a
   * second accept for the same ride changes nothing. The ride event and the
   * ride.matched outbox entry commit in the same transaction.
   */
  acceptRide(tenantId: string, rideId: string, driverId: string): Promise<boolean> {
    return withTenant(this.pool, tenantId, async (c) => {
      const updated = await c.query(
        `UPDATE rides SET state = 'MATCHED', driver_id = $2, matched_at = now()
         WHERE id = $1 AND state = 'REQUESTED'`,
        [rideId, driverId],
      );
      if (updated.rowCount !== 1) return false;
      await this.appendEvent(c, tenantId, rideId, 'matched', driverId);
      await c.query('INSERT INTO outbox (tenant_id, type, payload) VALUES ($1, $2, $3)', [
        tenantId,
        'ride.matched',
        { rideId, driverId },
      ]);
      return true;
    });
  }

  markNoDriver(tenantId: string, rideId: string): Promise<boolean> {
    return withTenant(this.pool, tenantId, async (c) => {
      const updated = await c.query(
        "UPDATE rides SET state = 'NO_DRIVER' WHERE id = $1 AND state = 'REQUESTED'",
        [rideId],
      );
      if (updated.rowCount !== 1) return false;
      await this.appendEvent(c, tenantId, rideId, 'no_driver', 'system');
      return true;
    });
  }

  getRide(tenantId: string, rideId: string): Promise<Ride | null> {
    return withTenant(this.pool, tenantId, async (c) => {
      const res = await c.query<RideRow>('SELECT * FROM rides WHERE id = $1', [rideId]);
      const row = res.rows[0];
      return row ? toRide(row) : null;
    });
  }

  eventsFor(tenantId: string, rideId: string): Promise<Array<{ type: string; actor: string }>> {
    return withTenant(this.pool, tenantId, async (c) => {
      const res = await c.query<{ type: string; actor: string }>(
        'SELECT type, actor FROM ride_events WHERE ride_id = $1 ORDER BY id',
        [rideId],
      );
      return res.rows;
    });
  }

  private async appendEvent(
    c: { query: Pool['query'] },
    tenantId: string,
    rideId: string,
    type: string,
    actor: string,
  ): Promise<void> {
    await c.query('INSERT INTO ride_events (tenant_id, ride_id, type, actor) VALUES ($1, $2, $3, $4)', [
      tenantId,
      rideId,
      type,
      actor,
    ]);
  }
}
