import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsService } from '../events/events.service';
import { PaymentAdapter } from '../payments/adapters/payment-adapter.interface';
import { adapterMap } from '../payments/adapters/adapter.registry'; // We'll create this to avoid circular deps
import { TxnStatus, EntryType, TxnCategory } from '@prisma/client';

export const PAYMENT_QUEUE = 'payment_handling';

@Processor(PAYMENT_QUEUE)
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly notifications: NotificationsService,
    private readonly events: EventsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { transactionId, providerId, accountRef, amount, userId, walletId } = job.data;

    this.logger.log(`🔄 Processing background payment [Job: ${job.id}] for Txn: ${transactionId}`);

    const adapter = adapterMap.get(providerId);
    if (!adapter) {
      throw new Error(`Provider adapter not found: ${providerId}`);
    }

    try {
      // 1. Mark PROCESSING
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: TxnStatus.PROCESSING },
      });
      await this.prisma.txnLifecycle.create({
        data: {
          transactionId,
          fromStatus: TxnStatus.PENDING,
          toStatus: TxnStatus.PROCESSING,
          triggeredBy: 'SYSTEM_JOB',
          message: `Attempt ${job.attemptsMade + 1}`,
        },
      });

      // 2. Call provider (the mock/real implementation)
      const result = await adapter.pay(accountRef, amount);

      if (!result.success) {
        throw new Error(result.message);
      }

      // 3. SUCCESS — Atomic Ledger Update
      await this.prisma.$transaction(async (tx) => {
        // Create Debit entry
        await tx.ledgerEntry.create({
          data: {
            walletId,
            type: EntryType.DEBIT,
            amount,
            reference: `${transactionId}:billpay`,
            transactionId,
            description: `${adapter.providerName} — ${accountRef}`,
            category: TxnCategory.BILLS,
          },
        });

        // Update Transaction
        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: TxnStatus.SUCCESS,
            billProviderRef: result.providerRef,
            settledAt: new Date(),
          },
        });

        // Log lifecycle
        await tx.txnLifecycle.create({
          data: {
            transactionId,
            fromStatus: TxnStatus.PROCESSING,
            toStatus: TxnStatus.SUCCESS,
            triggeredBy: 'SYSTEM_JOB',
          },
        });
      });

      // 4. Invalidate Cache & Notify
      await this.wallet.invalidateBalanceCache(userId);
      await this.notifications.sendPush(userId, {
        title: '✅ Bill Paid Successfully',
        body: `${adapter.providerName} Rs.${amount} paid for ${accountRef}`,
        type: 'PAYMENT',
      });
      await this.events.publish('PAYMENT_SUCCESS', { userId, transactionId, amount, type: 'BILL_PAY' });

      return { success: true, providerRef: result.providerRef };

    } catch (error: any) {
      this.logger.warn(`❌ Payment job attempt failed: ${error.message}`);
      
      // If BullMQ handles retries, we throw so it knows to retry
      // But first, log the interim failure to lifecycle
      await this.prisma.txnLifecycle.create({
        data: {
          transactionId,
          fromStatus: TxnStatus.PROCESSING,
          toStatus: TxnStatus.PROCESSING,
          triggeredBy: 'SYSTEM_JOB',
          message: `Attempt ${job.attemptsMade + 1} failed: ${error.message}`,
        },
      });

      throw error; // Rethrow for BullMQ retry mechanism
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    // This is called when ALL retries are exhausted
    const { transactionId, userId, providerId, amount } = job.data;
    const adapter = adapterMap.get(providerId);

    this.logger.error(`🚨 Payment job ${job.id} permanently failed after ${job.attemptsMade} attempts.`);

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TxnStatus.FAILED },
    });

    await this.prisma.txnLifecycle.create({
      data: {
        transactionId,
        fromStatus: TxnStatus.PROCESSING,
        toStatus: TxnStatus.FAILED,
        triggeredBy: 'SYSTEM_JOB',
        message: `Permanently failed: ${error.message}`,
      },
    });

    await this.notifications.sendPush(userId, {
      title: '❌ Payment Failed',
      body: `${adapter?.providerName || 'Payment'} failed after multiple attempts. No balance was deducted.`,
      type: 'PAYMENT_FAILED',
    });

    await this.events.publish('PAYMENT_FAILED', { userId, transactionId, amount, error: error.message });
  }
}
