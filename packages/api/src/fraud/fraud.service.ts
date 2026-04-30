import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TxnType, FraudType } from '@prisma/client';

interface ScoreInput {
  userId: string;
  amount: number;
  type: TxnType;
  recipientId?: string;
}

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // SCORE TRANSACTION (rule-based engine)
  // Returns a risk score 0.0–1.0
  // 0.0 = completely safe, 1.0 = definitely fraud
  // ──────────────────────────────────────────────────────────────
  async scoreTransaction(input: ScoreInput): Promise<number> {
    let score = 0;

    const profile = await this.prisma.riskProfile.findUnique({
      where: { userId: input.userId },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      include: { devices: { orderBy: { lastSeenAt: 'desc' }, take: 1 } },
    });

    if (!profile || !user) return 0;

    const weights = {
      large_amount: this.config.get<number>('RISK_WEIGHT_LARGE_AMOUNT', 0.30),
      unusual_hour: this.config.get<number>('RISK_WEIGHT_UNUSUAL_HOUR', 0.20),
      new_device: this.config.get<number>('RISK_WEIGHT_NEW_DEVICE', 0.20),
      ip_mismatch: this.config.get<number>('RISK_WEIGHT_IP_MISMATCH', 0.20),
      velocity: this.config.get<number>('RISK_WEIGHT_VELOCITY_BREACH', 0.30),
    };

    const largeTxnThreshold = this.config.get<number>('FRAUD_LARGE_TXN_THRESHOLD', 50000);

    // Rule 1: Large transaction
    if (input.amount > largeTxnThreshold) {
      score += weights.large_amount;
      this.logger.debug(`Risk: Large txn Rs.${input.amount} → +${weights.large_amount}`);
    } else if (input.amount > largeTxnThreshold / 2) {
      score += weights.large_amount * 0.5;
    }

    // Rule 2: Unusual hour (1 AM – 5 AM Nepal time)
    const hour = new Date().getUTCHours() + 5; // Nepal UTC+5:45 approx
    if (hour >= 1 && hour <= 5) {
      score += weights.unusual_hour;
      this.logger.debug(`Risk: Unusual hour ${hour} → +${weights.unusual_hour}`);
    }

    // Rule 3: Velocity breach (too many tx in last hour)
    const velocityKey = `velocity:${input.userId}`;
    const recentCount = await this.redis.get<number>(velocityKey) || 0;
    const txPerHour = this.config.get<number>('RATE_LIMIT_TXN_PER_HOUR', 10);
    if (recentCount >= txPerHour * 0.8) {
      score += weights.velocity;
      this.logger.debug(`Risk: Velocity ${recentCount}/${txPerHour} → +${weights.velocity}`);
    }

    // Rule 4: Multiple failed tx in short window
    if (profile.failedTxn1h >= 3) {
      score += 0.25;
    }

    // Cap at 1.0
    score = Math.min(score, 1.0);

    // Update risk profile in background
    this.updateRiskProfile(input.userId, score, input.amount).catch(() => {});

    // Auto-flag if threshold exceeded
    const flagScore = this.config.get<number>('FRAUD_AUTO_FLAG_SCORE', 0.7);
    if (score >= flagScore) {
      await this.createFraudAlert(input.userId, score, input);
    }

    return Math.round(score * 100) / 100;
  }

  async createFraudAlert(
    userId: string,
    riskScore: number,
    details: any,
  ): Promise<void> {
    const type = this.determineFraudType(details);
    await this.prisma.fraudAlert.create({
      data: { userId, riskScore, type, details, transactionId: details.transactionId },
    });

    const freezeScore = this.config.get<number>('FRAUD_AUTO_FREEZE_SCORE', 0.9);
    const freezeMode = this.config.get<string>('FRAUD_FREEZE_MODE', 'notify_only');

    if (riskScore >= freezeScore && freezeMode === 'automatic') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isFrozen: true, freezeReason: `Auto-frozen: risk score ${riskScore}` },
      });
      this.logger.warn(`🚨 User ${userId} auto-frozen. Risk score: ${riskScore}`);
    }
  }

  private determineFraudType(details: any): FraudType {
    if (details.amount > 50000) return FraudType.LARGE_TRANSACTION;
    return FraudType.VELOCITY_BREACH;
  }

  private async updateRiskProfile(userId: string, score: number, amount: number): Promise<void> {
    await this.prisma.riskProfile.update({
      where: { userId },
      data: {
        overallScore: score,
        txnCount24h: { increment: 1 },
        txnVolume24h: { increment: amount },
        lastTxnAt: new Date(),
        lastUpdated: new Date(),
      },
    });
    // Increment velocity counter (1h window)
    await this.redis.incr(`velocity:${userId}`, 3600);
  }

  async getUserRiskProfile(userId: string) {
    return this.prisma.riskProfile.findUnique({ where: { userId } });
  }

  async getOpenAlerts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [alerts, total] = await Promise.all([
      this.prisma.fraudAlert.findMany({
        where: { status: 'OPEN' },
        skip, take: limit,
        orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.fraudAlert.count({ where: { status: 'OPEN' } }),
    ]);
    return { alerts, total, page, limit };
  }

  async resolveAlert(alertId: string, adminId: string, note?: string) {
    return this.prisma.fraudAlert.update({
      where: { id: alertId },
      data: {
        status: 'REVIEWED',
        reviewedBy: adminId,
        reviewNote: note,
        resolvedAt: new Date(),
      },
    });
  }
}
