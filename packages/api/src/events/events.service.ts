import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';

// ═══════════════════════════════════════════════════════════════
// Event Bus — Redis Streams (MVP)
// Events are published here and consumed by background workers.
// Swap to Kafka in Phase 6 by changing EVENT_BUS=kafka
// ═══════════════════════════════════════════════════════════════

export type AppEvent =
  | 'USER_CREATED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'KYC_SUBMITTED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'FRAUD_FLAGGED'
  | 'ACCOUNT_FROZEN'
  | 'RECONCILIATION_FAILED'
  | 'REFUND_PROCESSED'
  | 'REWARD_EARNED';

export interface EventPayload {
  userId?: string;
  transactionId?: string;
  amount?: number;
  type?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly STREAM_PREFIX = 'events:';

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async publish(event: AppEvent, payload: EventPayload): Promise<void> {
    try {
      const stream = `${this.STREAM_PREFIX}${event.toLowerCase()}`;
      const data: Record<string, string> = {
        event,
        timestamp: new Date().toISOString(),
        payload: JSON.stringify(payload),
      };

      await this.redis.publish(stream, data);
      this.logger.debug(`📡 Event published: ${event} | ${JSON.stringify(payload)}`);
    } catch (err: any) {
      // Events are best-effort — don't fail the main operation
      this.logger.error(`Failed to publish event ${event}:`, err.message);
    }
  }

  async publishBatch(events: Array<{ event: AppEvent; payload: EventPayload }>): Promise<void> {
    await Promise.allSettled(events.map(({ event, payload }) => this.publish(event, payload)));
  }
}
