import { BadRequestException, Body, Controller, Headers, HttpCode, Param, ParseUUIDPipe, Post, UnauthorizedException } from '@nestjs/common';
import { z } from 'zod';
import { staffIdentity } from '../identity';
import { DisputeAssistService, type DraftResult } from './dispute-assist.service';

const body = z.object({ complaint: z.string().min(1).max(2000) });

@Controller('v1/assist')
export class AssistController {
  constructor(private readonly assist: DisputeAssistService) {}

  @Post('disputes/:rideId/draft')
  @HttpCode(200)
  async draft(
    @Headers() headers: Record<string, string | undefined>,
    @Param('rideId', new ParseUUIDPipe()) rideId: string,
    @Body() raw: unknown,
  ): Promise<DraftResult> {
    const who = staffIdentity.safeParse({ tenantId: headers['x-tenant-id'], staffId: headers['x-staff-id'] });
    if (!who.success) throw new UnauthorizedException();
    const input = body.safeParse(raw);
    if (!input.success) throw new BadRequestException('complaint must be 1 to 2000 characters');
    return this.assist.draft(who.data.tenantId, rideId, input.data.complaint);
  }
}
