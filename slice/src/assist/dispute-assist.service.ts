import { Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { RidesService } from '../rides/rides.service';
import { MODEL_CLIENT } from '../tokens';
import { buildCaseFile, SYSTEM_PROMPT, validateDraft } from './case-file';
import { assertDataPlane, AssistError, type ModelClient } from './model-gateway';

export type DraftResult =
  | { status: 'draft'; requiresHumanApproval: true; summary: string; draftReply: string; citedEventIds: number[] }
  | { status: 'rejected'; reason: string };

/**
 * Dispute assistant (ADR 14): reads one ride inside the caller's tenant,
 * drafts a summary and reply, and never acts. A human reviews and sends.
 */
@Injectable()
export class DisputeAssistService {
  private readonly log = new Logger(DisputeAssistService.name);

  constructor(
    private readonly rides: RidesService,
    @Inject(MODEL_CLIENT) private readonly model: ModelClient | null,
  ) {}

  async draft(tenantId: string, rideId: string, complaint: string): Promise<DraftResult> {
    if (!this.model) throw new ServiceUnavailableException('assistant is not configured');
    assertDataPlane(this.model);
    const ride = await this.rides.getRide(tenantId, rideId); // row-level security scopes the read
    if (!ride) throw new NotFoundException('ride not found');
    const caseFile = buildCaseFile(ride, await this.rides.eventsFor(tenantId, rideId), complaint);

    let raw: unknown;
    try {
      raw = await this.model.submitDraft({ system: SYSTEM_PROMPT, caseFile });
    } catch (err) {
      if (err instanceof AssistError) return { status: 'rejected', reason: err.message };
      throw err;
    }
    const checked = validateDraft(raw, caseFile);
    // Log the outcome, never the content: complaints and drafts are personal data.
    const cited = checked.ok ? checked.draft.citedEventIds.join(',') : '-';
    this.log.log(`assist draft ride=${rideId} model=${this.model.name} ok=${checked.ok} cited=${cited}`);
    if (!checked.ok) return { status: 'rejected', reason: checked.reason };
    return { status: 'draft', requiresHumanApproval: true, ...checked.draft };
  }
}
