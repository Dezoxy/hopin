import { Logger } from '@nestjs/common';
import {
  MessageBody,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  type OnGatewayConnection,
  type OnGatewayInit,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { z } from 'zod';
import { driverIdentity, latLng, type DriverIdentity } from '../identity';
import { MatchingService } from '../matching/matching.service';
import { RealtimeBus, driverRoom } from './realtime.bus';

const locationMsg = latLng.extend({ recordedAt: z.number().int().positive() });
const acceptMsg = z.object({ rideId: z.string().uuid() });

/** Realtime Gateway, driver namespace: location in, offers out. */
@WebSocketGateway({ namespace: 'driver' })
export class DriverGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly log = new Logger(DriverGateway.name);

  constructor(
    private readonly matching: MatchingService,
    private readonly bus: RealtimeBus,
  ) {}

  afterInit(ns: Namespace): void {
    this.bus.registerDrivers(ns);
  }

  handleConnection(socket: Socket): void {
    const who = driverIdentity.safeParse(socket.handshake.auth);
    if (!who.success) {
      socket.disconnect(true);
      return;
    }
    socket.data = who.data;
    void socket.join(driverRoom(who.data.tenantId, who.data.driverId));
  }

  @SubscribeMessage('location')
  async onLocation(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown): Promise<{ ok: boolean }> {
    const msg = locationMsg.safeParse(body);
    if (!msg.success) return { ok: false };
    const me = socket.data as DriverIdentity;
    const assigned = await this.matching.recordLocation(me.tenantId, me.driverId, msg.data);
    if (assigned) {
      this.bus.toRide(me.tenantId, assigned, 'driver.position', {
        rideId: assigned,
        lat: msg.data.lat,
        lng: msg.data.lng,
        recordedAt: msg.data.recordedAt,
      });
    }
    return { ok: true };
  }

  @SubscribeMessage('offer.accept')
  async onAccept(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown): Promise<{ ok: boolean }> {
    const msg = acceptMsg.safeParse(body);
    if (!msg.success) return { ok: false };
    const me = socket.data as DriverIdentity;
    try {
      return { ok: await this.matching.accept(me.tenantId, me.driverId, msg.data.rideId) };
    } catch (err) {
      this.log.error(`accept failed for ride ${msg.data.rideId}`, err as Error);
      return { ok: false };
    }
  }
}
