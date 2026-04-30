import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TxnStatus } from '@prisma/client';
import * as dayjs from 'dayjs';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Expire pending transactions older than 15 minutes
  @Cron('*/5 * * * *') // Every 5 minutes
  async expirePendingTransactions() {
    const expiredAt = dayjs().subtract(15, 'minute').toDate();
    const { count } = await this.prisma.transaction.updateMany({
      where: { status: TxnStatus.PENDING, createdAt: { lt: expiredAt } },
      data: { status: TxnStatus.EXPIRED, expiredAt: new Date() },
    });
    if (count > 0) this.logger.log(`Expired ${count} pending transactions`);
  }

  // Clean up expired OTPs
  @Cron('0 * * * *') // Every hour
  async cleanExpiredOtps() {
    const { count } = await this.prisma.oTP.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    if (count > 0) this.logger.debug(`Cleaned ${count} expired OTPs`);
  }

  // Clean up expired idempotency records
  @Cron('0 3 * * *') // every day at 3am
  async cleanExpiredIdempotencyRecords() {
    const { count } = await this.prisma.idempotencyRecord.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    if (count > 0) this.logger.debug(`Cleaned ${count} expired idempotency records`);
  }
}
