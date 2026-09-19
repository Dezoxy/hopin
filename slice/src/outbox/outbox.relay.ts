import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { Pool } from 'pg';
import { withTransaction } from '../db/tx';
import { RealtimeBus } from '../realtime/realtime.bus';
import { PG_POOL } from '../tokens';

const POLL_MS = 50;
const BATCH = 100;

interface OutboxRow {
  id: string;
  tenant_id: string;
  type: string;
  payload: { rideId: string; driverId?: string };
}

/**
 * Outbox Relay component. Every committed entry is handed to the Socket.IO
 * Redis adapter at least once: it is marked published in the same transaction
 * after the hand-off, so a crash before commit hands it off again. Socket.IO
 * itself has no delivery acknowledgement, so delivery to a client is at most
 * once; clients re-read ride state over REST after subscribing (event catalog).
 * SKIP LOCKED lets several relays share the work.
 */
@Injectable()
export class OutboxRelay implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(OutboxRelay.name);
  private timer?: NodeJS.Timeout;
  private current?: Promise<void>;

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly bus: RealtimeBus,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => this.safeTick(), POLL_MS);
  }

  /** Stops polling and waits for a tick in progress before the adapter closes. */
  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.current;
  }

  /** Publishes one batch; returns how many entries were sent. */
  tickOnce(): Promise<number> {
    return withTransaction(this.pool, async (c) => {
      const res = await c.query<OutboxRow>(
        `SELECT id, tenant_id, type, payload FROM outbox
         WHERE published_at IS NULL ORDER BY id LIMIT $1 FOR UPDATE SKIP LOCKED`,
        [BATCH],
      );
      if (res.rows.length === 0) return 0;
      res.rows.forEach((row) => this.publish(row));
      await c.query('UPDATE outbox SET published_at = now() WHERE id = ANY($1::bigint[])', [res.rows.map((r) => r.id)]);
      return res.rows.length;
    });
  }

  private publish(row: OutboxRow): void {
    if (row.type === 'ride.matched') {
      this.bus.toRide(row.tenant_id, row.payload.rideId, 'ride.state', {
        rideId: row.payload.rideId,
        state: 'MATCHED',
        driverId: row.payload.driverId,
      });
    }
  }

  private safeTick(): void {
    if (this.current) return;
    this.current = this.tickOnce()
      .then(() => undefined)
      .catch((err: unknown) => this.log.error('outbox tick failed', err as Error))
      .finally(() => {
        this.current = undefined;
      });
  }
}
