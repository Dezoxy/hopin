import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  type OnGatewayConnection,
  type OnGatewayInit,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { z } from 'zod';
import { passengerIdentity, type PassengerIdentity } from '../identity';
import { RidesService } from '../rides/rides.service';
import { RealtimeBus, rideRoom } from './realtime.bus';

const watchMsg = z.object({ rideId: z.string().uuid() });

/** Realtime Gateway, passenger namespace: ride state and driver position out. */
@WebSocketGateway({ namespace: 'passenger' })
export class PassengerGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(
    private readonly rides: RidesService,
    private readonly bus: RealtimeBus,
  ) {}

  afterInit(ns: Namespace): void {
    this.bus.registerPassengers(ns);
  }

  handleConnection(socket: Socket): void {
    const who = passengerIdentity.safeParse(socket.handshake.auth);
    if (!who.success) {
      socket.disconnect(true);
      return;
    }
    socket.data = who.data;
  }

  /** Joins a ride's room only if the ride belongs to this passenger in this tenant. */
  @SubscribeMessage('ride.watch')
  async onWatch(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown): Promise<{ ok: boolean }> {
    const msg = watchMsg.safeParse(body);
    if (!msg.success) return { ok: false };
    const me = socket.data as PassengerIdentity;
    const ride = await this.rides.getRide(me.tenantId, msg.data.rideId);
    if (!ride || ride.passengerId !== me.passengerId) return { ok: false };
    await socket.join(rideRoom(me.tenantId, ride.id));
    return { ok: true };
  }
}
