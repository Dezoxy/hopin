import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import type Redis from 'ioredis';
import { rankByEta, straightLineEta, type Candidate, type EtaProvider } from '../domain/eta';
import type { LatLng } from '../domain/geo';
import { RealtimeBus } from '../realtime/realtime.bus';
import { RidesService } from '../rides/rides.service';
import { REDIS } from '../tokens';

const SEARCH_RADIUS_M = 5_000;
const MAX_CANDIDATES = 10;
export const OFFER_TIMEOUT_MS = 15_000;
const MAX_OFFERS = 5;
const CITY_SPEED_KMH = 25;

const geoKey = (t: string): string => `drivers:${t}`;
const busyKey = (t: string): string => `busy:${t}`;
const assignKey = (t: string, d: string): string => `assign:${t}:${d}`;

export interface RideToMatch {
  readonly tenantId: string;
  readonly rideId: string;
  readonly pickup: LatLng;
}

interface PendingOffer {
  readonly tenantId: string;
  readonly driverId: string;
  readonly timer: NodeJS.Timeout;
}

/**
 * Matching component. Redis GEO pre-filters by distance; candidates are ranked
 * by ETA and offered one at a time. Pending offers are held in memory, which
 * limits the slice to one API instance (production: a durable timer).
 */
@Injectable()
export class MatchingService implements OnModuleDestroy {
  private readonly log = new Logger(MatchingService.name);
  private readonly pending = new Map<string, PendingOffer>();
  private readonly inflight = new Set<Promise<void>>();
  private readonly eta: EtaProvider = straightLineEta(CITY_SPEED_KMH);

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly rides: RidesService,
    private readonly bus: RealtimeBus,
  ) {}

  /** Stores the driver's position and returns the ride they are assigned to, if any. */
  async recordLocation(tenantId: string, driverId: string, pos: LatLng): Promise<string | null> {
    const [, [, assigned]] = (await this.redis
      .multi()
      .geoadd(geoKey(tenantId), pos.lng, pos.lat, driverId)
      .get(assignKey(tenantId, driverId))
      .exec()) as [[Error | null, number], [Error | null, string | null]];
    return assigned;
  }

  /** Tracked so shutdown can wait for dispatches that are still running. */
  dispatch(ride: RideToMatch): Promise<void> {
    const run = this.runDispatch(ride).finally(() => this.inflight.delete(run));
    this.inflight.add(run);
    return run;
  }

  private async runDispatch(ride: RideToMatch): Promise<void> {
    const candidates = await this.nearbyFreeDrivers(ride);
    const ranked = rankByEta(candidates, ride.pickup, this.eta).slice(0, MAX_OFFERS);
    await this.offerNext(ride, ranked);
  }

  /**
   * Accepts only the driver who currently holds the offer, in the same tenant.
   * Anything else is rejected without touching the live offer or its timer.
   */
  async accept(tenantId: string, driverId: string, rideId: string): Promise<boolean> {
    const offer = this.pending.get(rideId);
    if (!offer || offer.tenantId !== tenantId || offer.driverId !== driverId) return false;
    clearTimeout(offer.timer);
    this.pending.delete(rideId);
    const matched = await this.rides.acceptRide(tenantId, rideId, driverId);
    if (matched) {
      await this.redis.multi().sadd(busyKey(tenantId), driverId).set(assignKey(tenantId, driverId), rideId).exec();
    }
    return matched;
  }

  /**
   * Nest runs this before it disposes the Socket.IO adapter, so waiting here
   * keeps in-flight dispatches from publishing on a closed Redis connection.
   */
  async onModuleDestroy(): Promise<void> {
    this.pending.forEach((p) => clearTimeout(p.timer));
    this.pending.clear();
    await Promise.allSettled([...this.inflight]);
  }

  private async nearbyFreeDrivers(ride: RideToMatch): Promise<Candidate[]> {
    const raw = (await this.redis.geosearch(
      geoKey(ride.tenantId),
      'FROMLONLAT', ride.pickup.lng, ride.pickup.lat,
      'BYRADIUS', SEARCH_RADIUS_M, 'm',
      'ASC', 'COUNT', MAX_CANDIDATES,
      'WITHCOORD',
    )) as Array<[string, [string, string]]>;
    if (raw.length === 0) return [];
    const busy = await this.redis.smismember(busyKey(ride.tenantId), ...raw.map(([id]) => id));
    return raw
      .filter((_, i) => busy[i] === 0)
      .map(([driverId, [lng, lat]]) => ({ driverId, position: { lat: Number(lat), lng: Number(lng) } }));
  }

  private async offerNext(ride: RideToMatch, remaining: readonly Candidate[]): Promise<void> {
    const [candidate, ...rest] = remaining;
    if (!candidate) {
      if (await this.rides.markNoDriver(ride.tenantId, ride.rideId)) {
        this.bus.toRide(ride.tenantId, ride.rideId, 'ride.state', { rideId: ride.rideId, state: 'NO_DRIVER' });
      }
      return;
    }
    const timer = setTimeout(() => {
      this.pending.delete(ride.rideId);
      this.offerNext(ride, rest).catch((err: unknown) => this.log.error(`offer failed for ${ride.rideId}`, err));
    }, OFFER_TIMEOUT_MS);
    this.pending.set(ride.rideId, { tenantId: ride.tenantId, driverId: candidate.driverId, timer });
    this.bus.toDriver(ride.tenantId, candidate.driverId, 'offer.new', {
      rideId: ride.rideId,
      pickup: ride.pickup,
      expiresInMs: OFFER_TIMEOUT_MS,
    });
  }
}
