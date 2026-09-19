import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { latLng, passengerIdentity, type PassengerIdentity } from '../identity';
import { MatchingService } from '../matching/matching.service';
import { RidesService, type Ride } from './rides.service';

function identityFrom(headers: Record<string, string | undefined>): PassengerIdentity {
  const who = passengerIdentity.safeParse({
    tenantId: headers['x-tenant-id'],
    passengerId: headers['x-passenger-id'],
  });
  if (!who.success) throw new UnauthorizedException();
  return who.data;
}

@Controller('v1/rides')
export class RidesController {
  private readonly log = new Logger(RidesController.name);

  constructor(
    private readonly rides: RidesService,
    private readonly matching: MatchingService,
  ) {}

  /** Stores the ride, answers at once, then matches after the commit. */
  @Post()
  @HttpCode(201)
  async request(
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: unknown,
  ): Promise<{ rideId: string }> {
    const me = identityFrom(headers);
    const pickup = latLng.safeParse(body);
    if (!pickup.success) throw new BadRequestException('pickup must be { lat, lng }');
    const { rideId } = await this.rides.requestRide(me.tenantId, me.passengerId, pickup.data);
    this.matching
      .dispatch({ tenantId: me.tenantId, rideId, pickup: pickup.data })
      .catch((err: unknown) => this.log.error(`dispatch failed for ride ${rideId}`, err as Error));
    return { rideId };
  }

  @Get(':id')
  async get(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Ride> {
    const me = identityFrom(headers);
    const ride = await this.rides.getRide(me.tenantId, id);
    if (!ride || ride.passengerId !== me.passengerId) throw new NotFoundException();
    return ride;
  }
}
