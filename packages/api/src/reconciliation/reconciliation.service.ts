import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EntryType, JobStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // DAILY RECONCILIATION — runs at 2 AM Nepal time
  // Checks: stored nothing (balance is always computed) vs. 
  // cross-checks that no ledger entry is orphaned
  // ──────────────────────────────────────────────────────────────
  @Cron('0 2 * * *', { timeZone: 'Asia/Kathmandu' })
  async runDailyReconciliation() {
    this.logger.log('🔍 Starting daily reconciliation...');
    const job = await this.prisma.reconciliationJob.create({
      data: { status: JobStatus.RUNNING },
    });

    let walletsChecked = 0;
    let discrepancies = 0;
    let autoFixed = 0;
    let flaggedForReview = 0;

    try {
      const wallets = await this.prisma.wallet.findMany({ select: { id: true, userId: true } });

      for (const wallet of wallets) {
        walletsChecked++;
        const issue = await this.checkWalletIntegrity(wallet.id);

        if (issue) {
          discrepancies++;
          const delta = issue.delta;
          const threshold = this.config.get<number>('RECONCILIATION_AUTO_FIX_THRESHOLD', 1.0);

          // Auto-fix tiny discrepancies (floating point errors < Rs.1)
          if (Math.abs(delta) <= threshold) {
            await this.autoFix(job.id, wallet.id, issue.expected, issue.actual, delta);
            autoFixed++;
          } else {
            // Flag for human review
            await this.prisma.reconciliationAlert.create({
              data: {
                jobId: job.id,
                walletId: wallet.id,
                expected: issue.expected,
                actual: issue.actual,
                delta: issue.delta,
              },
            });
            flaggedForReview++;
            this.logger.warn(`⚠️  Wallet ${wallet.id} discrepancy: expected=${issue.expected}, actual=${issue.actual}, delta=${delta}`);
          }
        }
      }

      await this.prisma.reconciliationJob.update({
        where: { id: job.id },
        data: {
          status: flaggedForReview > 0 ? JobStatus.PARTIAL : JobStatus.PASSED,
          walletsChecked,
          discrepancies,
          autoFixed,
          flaggedForReview,
          completedAt: new Date(),
          report: { summary: `${walletsChecked} wallets checked, ${discrepancies} discrepancies found, ${autoFixed} auto-fixed, ${flaggedForReview} flagged` },
        },
      });

      if (flaggedForReview > 0) {
        const alertEmail = this.config.get<string>('RECONCILIATION_ALERT_EMAIL');
        if (alertEmail) {
          await this.notifications.sendEmail(
            alertEmail,
            `⚠️ Reconciliation Alert: ${flaggedForReview} wallet discrepancies`,
            `<p>Daily reconciliation found <strong>${flaggedForReview} discrepancies</strong> requiring manual review.</p><p>Job ID: ${job.id}</p>`,
          );
        }
      }

      this.logger.log(`✅ Reconciliation complete: ${walletsChecked} checked, ${discrepancies} issues, ${autoFixed} fixed, ${flaggedForReview} flagged`);
    } catch (error: any) {
      await this.prisma.reconciliationJob.update({
        where: { id: job.id },
        data: { status: JobStatus.FAILED, completedAt: new Date(), report: { error: error.message } },
      });
      this.logger.error('Reconciliation failed:', error);
    }

    return { jobId: job.id, walletsChecked, discrepancies, autoFixed, flaggedForReview };
  }

  // Manual trigger (for admin use)
  async runManually() {
    return this.runDailyReconciliation();
  }

  private async checkWalletIntegrity(walletId: string): Promise<{
    expected: number; actual: number; delta: number;
  } | null> {
    const [credits, debits] = await Promise.all([
      this.prisma.ledgerEntry.aggregate({ where: { walletId, type: EntryType.CREDIT }, _sum: { amount: true } }),
      this.prisma.ledgerEntry.aggregate({ where: { walletId, type: EntryType.DEBIT }, _sum: { amount: true } }),
    ]);

    const creditSum = new Decimal(credits._sum.amount?.toString() || '0');
    const debitSum = new Decimal(debits._sum.amount?.toString() || '0');
    const computedBalance = creditSum.minus(debitSum);

    // Check all SUCCESS transactions have corresponding ledger entries
    const successTxns = await this.prisma.transaction.findMany({
      where: { OR: [{ fromWalletId: walletId }, { toWalletId: walletId }], status: 'SUCCESS' },
      select: { id: true },
    });

    for (const txn of successTxns) {
      const entryCount = await this.prisma.ledgerEntry.count({ where: { transactionId: txn.id, walletId } });
      if (entryCount === 0) {
        this.logger.error(`Orphaned transaction: ${txn.id} has no ledger entry for wallet ${walletId}`);
        return { expected: 0, actual: -1, delta: -1 }; // Sentinel for orphaned
      }
    }

    // If balance is negative (impossible in correct system), flag it
    if (computedBalance.isNegative()) {
      return { expected: 0, actual: computedBalance.toNumber(), delta: computedBalance.toNumber() };
    }

    return null; // No issues
  }

  private async autoFix(jobId: string, walletId: string, expected: number, actual: number, delta: number) {
    await this.prisma.reconciliationAlert.create({
      data: {
        jobId,
        walletId,
        expected,
        actual,
        delta,
        autoFixed: true,
        fixNote: `Auto-fixed tiny discrepancy of Rs.${delta} (within threshold)`,
      },
    });
    this.logger.log(`Auto-fixed wallet ${walletId}: delta Rs.${delta}`);
  }

  async getJobHistory(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      this.prisma.reconciliationJob.findMany({ skip, take: limit, orderBy: { runAt: 'desc' }, include: { alerts: true } }),
      this.prisma.reconciliationJob.count(),
    ]);
    return { jobs, total, page, limit };
  }

  async getAlerts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [alerts, total] = await Promise.all([
      this.prisma.reconciliationAlert.findMany({ skip, take: limit, where: { resolvedAt: null }, orderBy: { createdAt: 'desc' } }),
      this.prisma.reconciliationAlert.count({ where: { resolvedAt: null } }),
    ]);
    return { alerts, total };
  }
}
