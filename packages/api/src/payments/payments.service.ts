import {
  Injectable, NotFoundException, BadRequestException,
  Logger, ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { WalletService } from '../wallet/wallet.service';
import { FraudService } from '../fraud/fraud.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsService } from '../events/events.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PAYMENT_QUEUE } from '../jobs/payment.processor';
import { adapterMap } from './adapters/adapter.registry';
import { PaymentAdapter } from './adapters/payment-adapter.interface';
import { BillCategory, TxnStatus, TxnType, EntryType, TxnCategory, TxnChannel } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';
import * as dayjs from 'dayjs';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly adapters = new Map<string, PaymentAdapter>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly wallet: WalletService,
    private readonly fraud: FraudService,
    private readonly config: ConfigService,
    @InjectQueue(PAYMENT_QUEUE) private readonly paymentQueue: Queue,
  ) {}


  // ──────────────────────────────────────────────────────────────
  // GET ALL PROVIDERS
  // ──────────────────────────────────────────────────────────────
  getAllProviders() {
    const providers: Record<string, any[]> = {};
    adapterMap.forEach((adapter) => {
      if (!providers[adapter.category]) providers[adapter.category] = [];
      providers[adapter.category].push({
        id: adapter.providerId,
        name: adapter.providerName,
        category: adapter.category,
        logoUrl: adapter.logoUrl,
        requiresInquiry: adapter.requiresInquiry,
        fixedAmount: adapter.fixedAmount,
      });
    });
    return providers;
  }

  getProvidersByCategory(category: string) {
    const result: any[] = [];
    adapterMap.forEach((adapter) => {
      if (adapter.category.toUpperCase() === category.toUpperCase()) {
        result.push({
          id: adapter.providerId,
          name: adapter.providerName,
          logoUrl: adapter.logoUrl,
          requiresInquiry: adapter.requiresInquiry,
          fixedAmount: adapter.fixedAmount,
        });
      }
    });
    return result;
  }

  // ──────────────────────────────────────────────────────────────
  // INQUIRE (fetch bill details before payment)
  // ──────────────────────────────────────────────────────────────
  async inquire(userId: string, providerId: string, accountRef: string, params?: Record<string, string>) {
    const adapter = adapterMap.get(providerId);
    if (!adapter) throw new NotFoundException(`Provider '${providerId}' not found.`);

    const cacheKey = `inquiry:${providerId}:${accountRef}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const result = await adapter.inquire(accountRef, params);
    if (result.success) {
      await this.redis.set(cacheKey, result, 120); // Cache for 2 min
    }
    return result;
  }

  // ──────────────────────────────────────────────────────────────
  // PAY BILL — the main payment flow
  // ──────────────────────────────────────────────────────────────
  async payBill(
    userId: string,
    dto: {
      providerId: string;
      accountRef: string;
      amount: number;
      idempotencyKey: string;
      note?: string;
      params?: Record<string, string>;
    },
  ) {
    const { providerId, accountRef, amount, idempotencyKey } = dto;

    const adapter = adapterMap.get(providerId);
    if (!adapter) throw new NotFoundException(`Provider '${providerId}' not found.`);

    // Validate amount
    if (amount < 1) throw new BadRequestException('Amount must be at least Rs. 1');

    // Check balance
    const walletData = await this.wallet.getWalletByUserId(userId);
    const { balance } = await this.wallet.getBalance(userId);
    if (new Decimal(balance).lessThan(amount)) {
      throw new BadRequestException(`Insufficient balance. Available: Rs. ${balance}`);
    }

    // Check daily limit
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { kycLevel: true } });
    const limitKey = `KYC_L${user?.kycLevel || 0}_DAILY_LIMIT`;
    const dailyLimit = this.config.get<number>(limitKey, 1000);
    const todayDebits = await this.prisma.ledgerEntry.aggregate({
      where: { walletId: walletData.id, type: EntryType.DEBIT, createdAt: { gte: dayjs().startOf('day').toDate() } },
      _sum: { amount: true },
    });
    if (new Decimal(todayDebits._sum.amount?.toString() || '0').plus(amount).greaterThan(dailyLimit)) {
      throw new ForbiddenException(`Daily limit of Rs.${dailyLimit} exceeded. Complete KYC for higher limits.`);
    }

    // Fraud scoring
    const riskScore = await this.fraud.scoreTransaction({ userId, amount, type: TxnType.BILL_PAY });
    if (riskScore >= this.config.get<number>('FRAUD_AUTO_FREEZE_SCORE', 0.9)) {
      throw new ForbiddenException('Transaction blocked by security system.');
    }

    const billCategory = providerId as BillCategory;

    // Create transaction (PENDING)
    const transaction = await this.prisma.transaction.create({
      data: {
        idempotencyKey,
        fromWalletId: walletData.id,
        amount,
        fee: 0,
        netAmount: amount,
        status: TxnStatus.PENDING,
        type: TxnType.BILL_PAY,
        billCategory,
        billProvider: adapter.providerName,
        billRef: accountRef,
        channel: TxnChannel.APP,
        riskScore,
        metadata: { note: dto.note, params: dto.params },
      },
    });

    await this.prisma.txnLifecycle.create({
      data: { transactionId: transaction.id, toStatus: TxnStatus.PENDING, triggeredBy: userId },
    });

    // Enqueue background processing job
    await this.paymentQueue.add(
      'process_payment',
      {
        transactionId: transaction.id,
        providerId,
        accountRef,
        amount,
        userId,
        walletId: walletData.id,
      },
      {
        jobId: idempotencyKey, // Ensure unique job per idempotency key
        attempts: this.config.get<number>('JOB_RETRY_ATTEMPTS', 3),
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    return {
      success: true,
      message: 'Transaction is being processed.',
      transactionId: transaction.id,
      status: TxnStatus.PENDING,
    };
  }

  // REPLACED BY PaymentProcessor
  // private async processPaymentWithRetry(...) { ... }

  // ──────────────────────────────────────────────────────────────
  // SCAN QR (Merchants or Users)
  // ──────────────────────────────────────────────────────────────
  async scanQR(qrData: string) {
    if (qrData.startsWith('KKM-MERCHANT-')) {
      const merchantId = qrData.replace('KKM-MERCHANT-', '');
      const merchant = await this.prisma.merchant.findUnique({
        where: { id: merchantId },
        include: { user: { select: { fullName: true, email: true } } },
      });
      if (!merchant) throw new NotFoundException('Merchant not found.');
      return { type: 'MERCHANT', data: merchant };
    }

    if (qrData.startsWith('KKM-USER-')) {
      const userId = qrData.replace('KKM-USER-', '');
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, phone: true },
      });
      if (!user) throw new NotFoundException('User not found.');
      return { type: 'USER', data: user };
    }

    throw new BadRequestException('Invalid QR code format.');
  }

  // ──────────────────────────────────────────────────────────────
  // PAY MERCHANT — direct wallet-to-merchant-wallet transfer
  // ──────────────────────────────────────────────────────────────
  async payMerchant(userId: string, dto: { merchantId: string; amount: number; idempotencyKey: string; note?: string }) {
    const { merchantId, amount, idempotencyKey } = dto;

    const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId }, include: { user: true } });
    if (!merchant) throw new NotFoundException('Merchant not found.');

    const fromWallet = await this.wallet.getWalletByUserId(userId);
    const toWallet = await this.wallet.getWalletByUserId(merchant.userId);

    // Fraud check
    const riskScore = await this.fraud.scoreTransaction({ userId, amount, type: TxnType.MERCHANT_PAY });
    if (riskScore >= 0.9) throw new ForbiddenException('Transaction blocked by security.');

    return await this.prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.create({
        data: {
          idempotencyKey,
          fromWalletId: fromWallet.id,
          toWalletId: toWallet.id,
          amount,
          fee: 0,
          netAmount: amount,
          status: TxnStatus.SUCCESS,
          type: TxnType.MERCHANT_PAY,
          channel: TxnChannel.QR_SCAN,
          riskScore,
          metadata: { note: dto.note },
          settledAt: new Date(),
        },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: fromWallet.id,
          type: EntryType.DEBIT,
          amount,
          reference: `${txn.id}-DEBIT`,
          transactionId: txn.id,
          category: TxnCategory.SHOPPING,
          description: `Payment to ${merchant.businessName}`,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: toWallet.id,
          type: EntryType.CREDIT,
          amount,
          reference: `${txn.id}-CREDIT`,
          transactionId: txn.id,
          category: TxnCategory.SHOPPING,
          description: `Payment received from customer`,
        },
      });

      return txn;
    });
  }

  // ──────────────────────────────────────────────────────────────
  // GET PAYMENT HISTORY
  // ──────────────────────────────────────────────────────────────
  async getHistory(userId: string, page = 1, limit = 20) {
    const wallet = await this.wallet.getWalletByUserId(userId);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { fromWalletId: wallet.id, type: TxnType.BILL_PAY },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { lifecycle: { orderBy: { timestamp: 'asc' } } },
      }),
      this.prisma.transaction.count({ where: { fromWalletId: wallet.id, type: TxnType.BILL_PAY } }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ──────────────────────────────────────────────────────────────
  // GET TRANSACTION STATUS (with full lifecycle)
  // ──────────────────────────────────────────────────────────────
  async getTransactionStatus(userId: string, transactionId: string) {
    const wallet = await this.wallet.getWalletByUserId(userId);
    const txn = await this.prisma.transaction.findFirst({
      where: { id: transactionId, fromWalletId: wallet.id },
      include: { lifecycle: { orderBy: { timestamp: 'asc' } } },
    });
    if (!txn) throw new NotFoundException('Transaction not found.');
    return txn;
  }
}
