import {
  Injectable, BadRequestException, ForbiddenException,
  NotFoundException, Logger, ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EventsService } from '../events/events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FraudService } from '../fraud/fraud.service';
import { EntryType, TxnStatus, TxnType, TxnChannel, TxnCategory } from '@prisma/client';
import { Decimal } from 'decimal.js';
import * as dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { SendMoneyDto } from './dto/send-money.dto';
import { AddMoneyDto } from './dto/add-money.dto';

import { NCHLAdapter } from './adapters/nchl.adapter';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly events: EventsService,
    private readonly notifications: NotificationsService,
    private readonly fraud: FraudService,
    private readonly config: ConfigService,
    private readonly nchl: NCHLAdapter,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // BANK LINKING & LOADING
  // ──────────────────────────────────────────────────────────────
  async initiateBankLink(userId: string, dto: any) {
    // Call NCHL to get the redirect URL
    return this.nchl.initiateBankLink(userId, dto);
  }

  async loadFromBank(userId: string, amount: number, mandateToken: string, idempotencyKey: string) {
    await this.checkIdempotency(idempotencyKey);
    const wallet = await this.getWalletByUserId(userId);

    // 1. Pull funds from NCHL
    const nchlResult = await this.nchl.pullFunds(mandateToken, amount, idempotencyKey);

    if (nchlResult.status !== 'SUCCESS') {
      throw new BadRequestException('Bank transfer failed at NCHL.');
    }

    // 2. Credit the ledger
    const transaction = await this.prisma.$transaction(async (tx) => {
      return this.executeTransfer(tx, {
        toWalletId: wallet.id,
        amount,
        type: TxnType.TOP_UP,
        idempotencyKey,
        description: `Load fund from Bank (NCHL)`,
        metadata: { nchlTxnId: nchlResult.nchlTxnId },
      });
    });

    await this.invalidateBalanceCache(userId);
    return { transaction, balance: (await this.getBalance(userId)).balance };
  }

  // ──────────────────────────────────────────────────────────────
  // GET BALANCE (computed from ledger)
  // ──────────────────────────────────────────────────────────────
  async getBalance(userId: string): Promise<{
    balance: string;
    currency: string;
    walletId: string;
    lastUpdated: Date;
  }> {
    const cacheKey = `wallet:balance:${userId}`;
    
    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached as any;

    const wallet = await this.getWalletByUserId(userId);

    const credits = await this.prisma.ledgerEntry.aggregate({
      where: { walletId: wallet.id, type: EntryType.CREDIT },
      _sum: { amount: true },
    });

    const debits = await this.prisma.ledgerEntry.aggregate({
      where: { walletId: wallet.id, type: EntryType.DEBIT },
      _sum: { amount: true },
    });

    const creditSum = new Decimal(credits._sum.amount?.toString() || '0');
    const debitSum = new Decimal(debits._sum.amount?.toString() || '0');
    const balance = creditSum.minus(debitSum);

    const result = {
      balance: balance.isNegative() ? '0.00' : balance.toFixed(2),
      currency: wallet.currency,
      walletId: wallet.id,
      lastUpdated: new Date(),
    };

    // Store in cache for TTL
    await this.redis.set(cacheKey, result, 60);

    return result;
  }

  // ──────────────────────────────────────────────────────────────
  // ATOMIC TRANSFER ENGINE (The Hardened Core)
  // ──────────────────────────────────────────────────────────────
  private async executeTransfer(
    tx: any,
    params: {
      fromWalletId?: string;
      toWalletId?: string;
      amount: number;
      type: TxnType;
      idempotencyKey: string;
      metadata?: any;
      description?: string;
    },
  ) {
    const { fromWalletId, toWalletId, amount, type, idempotencyKey } = params;

    // 1. Create Transaction in PROCESSING state
    const txn = await tx.transaction.create({
      data: {
        idempotencyKey,
        fromWalletId,
        toWalletId,
        amount,
        fee: 0,
        netAmount: amount,
        status: TxnStatus.PROCESSING,
        type,
        channel: TxnChannel.APP,
        metadata: params.metadata || {},
      },
    });

    // 2. Perform DEBIT
    if (fromWalletId) {
      const credits = await tx.ledgerEntry.aggregate({ where: { walletId: fromWalletId, type: EntryType.CREDIT }, _sum: { amount: true } });
      const debits = await tx.ledgerEntry.aggregate({ where: { walletId: fromWalletId, type: EntryType.DEBIT }, _sum: { amount: true } });
      const currentBalance = new Decimal(credits._sum.amount?.toString() || '0').minus(new Decimal(debits._sum.amount?.toString() || '0'));

      if (currentBalance.lessThan(amount)) {
        throw new BadRequestException('Insufficient funds in ledger.');
      }

      await tx.ledgerEntry.create({
        data: {
          walletId: fromWalletId,
          type: EntryType.DEBIT,
          amount,
          transactionId: txn.id,
          description: params.description || `Debit for ${type}`,
          category: TxnCategory.OTHER,
        },
      });
    }

    // 3. Perform CREDIT
    if (toWalletId) {
      await tx.ledgerEntry.create({
        data: {
          walletId: toWalletId,
          type: EntryType.CREDIT,
          amount,
          transactionId: txn.id,
          description: params.description || `Credit for ${type}`,
          category: TxnCategory.OTHER,
        },
      });
    }

    // 4. Integrity Check
    if (fromWalletId && toWalletId) {
      const entryCount = await tx.ledgerEntry.count({ where: { transactionId: txn.id } });
      if (entryCount !== 2) throw new ConflictException('Ledger integrity violation.');
    }

    // 5. Finalize
    return tx.transaction.update({
      where: { id: txn.id },
      data: { status: TxnStatus.SUCCESS, settledAt: new Date() },
    });
  }

  // ──────────────────────────────────────────────────────────────
  // REFACTORED OPERATIONS
  // ──────────────────────────────────────────────────────────────
  async addMoney(userId: string, dto: AddMoneyDto, idempotencyKey: string) {
    await this.checkIdempotency(idempotencyKey);
    const wallet = await this.getWalletByUserId(userId);

    const transaction = await this.prisma.$transaction(async (tx) => {
      return this.executeTransfer(tx, {
        toWalletId: wallet.id,
        amount: dto.amount,
        type: TxnType.TOP_UP,
        idempotencyKey,
        description: `Top-up via ${dto.source}`,
      });
    });

    await this.invalidateBalanceCache(userId);
    return { transaction, balance: (await this.getBalance(userId)).balance };
  }

  async sendMoney(senderId: string, dto: SendMoneyDto, idempotencyKey: string) {
    await this.checkIdempotency(idempotencyKey);
    const senderWallet = await this.getWalletByUserId(senderId);
    const receiver = await this.prisma.user.findFirst({
      where: dto.recipientPhone ? { phone: dto.recipientPhone } : { email: dto.recipientEmail },
      include: { wallet: true },
    });

    if (!receiver || !receiver.wallet) throw new NotFoundException('Recipient not found.');
    if (receiver.id === senderId) throw new BadRequestException('Self-transfer not allowed.');

    const transaction = await this.prisma.$transaction(async (tx) => {
      return this.executeTransfer(tx, {
        fromWalletId: senderWallet.id,
        toWalletId: receiver.wallet!.id,
        amount: dto.amount,
        type: TxnType.TRANSFER,
        idempotencyKey,
        description: `P2P Transfer to ${receiver.fullName}`,
      });
    });

    await Promise.all([this.invalidateBalanceCache(senderId), this.invalidateBalanceCache(receiver.id)]);
    return { transaction, newBalance: (await this.getBalance(senderId)).balance };
  }

  async getStatement(userId: string, filters: any) {
    const wallet = await this.getWalletByUserId(userId);
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      include: { transaction: true },
    });
    return { entries };
  }

  // ──────────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────────
  async getWalletByUserId(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found.');
    return wallet;
  }

  private async checkIdempotency(key: string) {
    const existing = await this.redis.get(`idempotency:${key}`);
    if (existing) throw new ConflictException('Duplicate request.');
    await this.redis.set(`idempotency:${key}`, { status: 'processing' }, 86400);
  }

  async invalidateBalanceCache(userId: string) {
    await this.redis.del(`wallet:balance:${userId}`);
  }

  // Proxy to VaultService (to satisfy controller)
  // We can also just inject VaultService here if we want to be more formal
  async createVault(userId: string, data: any) {
    const wallet = await this.getWalletByUserId(userId);
    return this.prisma.vault.create({
      data: {
        walletId: wallet.id,
        ...data,
      },
    });
  }

  async depositToVault(userId: string, vaultId: string, amount: number, idempotencyKey: string) {
    await this.checkIdempotency(idempotencyKey);
    const wallet = await this.getWalletByUserId(userId);
    const vault = await this.prisma.vault.findUnique({ where: { id: vaultId } });
    if (!vault || vault.walletId !== wallet.id) throw new NotFoundException('Vault not found');

    return this.prisma.$transaction(async (tx) => {
      // Logic from VaultService but inside WalletService for simplicity now
      return tx.vault.update({
        where: { id: vaultId },
        data: { 
          savedAmount: { increment: amount },
          isCompleted: vault.savedAmount + amount >= vault.targetAmount,
          completedAt: vault.savedAmount + amount >= vault.targetAmount ? new Date() : null,
        },
      });
    });
  }

  // ──────────────────────────────────────────────────────────────
  // INTERNAL HELPERS (Missing from previous version)
  // ──────────────────────────────────────────────────────────────
  private async checkDailyLimit(userId: string, amount: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    const startOfDay = dayjs().startOf('day').toDate();
    const debits = await this.prisma.ledgerEntry.aggregate({
      where: { 
        walletId: (await this.getWalletByUserId(userId)).id, 
        type: EntryType.DEBIT, 
        createdAt: { gte: startOfDay } 
      },
      _sum: { amount: true },
    });

    const spentToday = new Decimal(debits._sum.amount?.toString() || '0');
    const limit = user.kycLevel === 0 ? 1000 : 50000; // Rs. 1000 for L0, Rs. 50,000 for others

    if (spentToday.plus(amount).greaterThan(limit)) {
      throw new BadRequestException(`Daily transaction limit exceeded. Your limit is Rs. ${limit}`);
    }
  }

  private async validateAmount(amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
  }
}
