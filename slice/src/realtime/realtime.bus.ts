import { Injectable } from '@nestjs/common';
import type { Namespace } from 'socket.io';

export const driverRoom = (tenantId: string, driverId: string): string => `d:${tenantId}:${driverId}`;
export const rideRoom = (tenantId: string, rideId: string): string => `r:${tenantId}:${rideId}`;

/**
 * Sends events to driver and ride rooms. The gateways register their
 * namespaces here, so services can publish without depending on gateways.
 */
@Injectable()
export class RealtimeBus {
  private drivers?: Namespace;
  private passengers?: Namespace;

  registerDrivers(ns: Namespace): void {
    this.drivers = ns;
  }

  registerPassengers(ns: Namespace): void {
    this.passengers = ns;
  }

  toDriver(tenantId: string, driverId: string, event: string, payload: unknown): void {
    this.drivers?.to(driverRoom(tenantId, driverId)).emit(event, payload);
  }

  toRide(tenantId: string, rideId: string, event: string, payload: unknown): void {
    this.passengers?.to(rideRoom(tenantId, rideId)).emit(event, payload);
  }
}
