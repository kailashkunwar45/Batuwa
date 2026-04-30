import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { Decimal } from 'decimal.js';
import { EventsService } from '../events/events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FraudService } from '../fraud/fraud.service';
import { NCHLAdapter } from './adapters/nchl.adapter';

// ═══════════════════════════════════════════════════════════════
// LEDGER INTEGRITY TESTS
// These tests must ALWAYS pass. They are the financial guarantee
// that Balance = SUM(CREDIT) - SUM(DEBIT) always holds.
// ═══════════════════════════════════════════════════════════════

describe('Ledger Engine — Integrity Tests', () => {
  let service: WalletService;

  // Mock implementations
  const mockPrisma: any = {
    wallet: { findUnique: jest.fn() },
    ledgerEntry: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      groupBy: jest.fn(),
    },
    transaction: { create: jest.fn(), update: jest.fn() },
    txnLifecycle: { create: jest.fn() },
    user: { findUnique: jest.fn(), findFirst: jest.fn() },
    vault: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
    $transaction: jest.fn((fn: any) => fn(mockPrisma as any)),
  };

  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    incr: jest.fn().mockResolvedValue(1),
  };

  const mockConfig = {
    get: jest.fn((key: string, defaultVal?: any) => {
      const values: Record<string, any> = {
        LEDGER_STRICT_MODE: true,
        CACHE_TTL_BALANCE_SECONDS: 10,
        IDEMPOTENCY_ENABLED: true,
        IDEMPOTENCY_CACHE_TTL: 86400,
        OTP_TEST_MODE: true,
        FRAUD_AUTO_FREEZE_SCORE: 0.9,
        KYC_L0_DAILY_LIMIT: 1000,
      };
      return values[key] ?? defaultVal;
    }),
  };

  const mockFraud = { scoreTransaction: jest.fn().mockResolvedValue(0.1) };
  const mockNotifications = { sendPush: jest.fn().mockResolvedValue(undefined) };
  const mockEvents = { publish: jest.fn().mockResolvedValue(undefined) };
  const mockNchl = { pullFunds: jest.fn(), initiateBankLink: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: ConfigService, useValue: mockConfig },
        { provide: FraudService, useValue: mockFraud },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: EventsService, useValue: mockEvents },
        { provide: NCHLAdapter, useValue: mockNchl },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    jest.resetAllMocks();
    mockRedis.get.mockResolvedValue(null); // Always miss cache in tests
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Balance = SUM(CREDIT) - SUM(DEBIT)
  // ─────────────────────────────────────────────────────────────
  describe('Balance computation', () => {
    it('should compute balance as SUM(credits) - SUM(debits)', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1', currency: 'NPR', userId: 'user-1',
      });

      // Credits: 5000 + 3000 = 8000
      mockPrisma.ledgerEntry.aggregate
        .mockResolvedValueOnce({ _sum: { amount: new Decimal(8000) } }) // credits
        .mockResolvedValueOnce({ _sum: { amount: new Decimal(2000) } }); // debits

      const result = await service.getBalance('user-1');

      // Balance = 8000 - 2000 = 6000
      expect(result.balance).toBe('6000.00');
      expect(result.currency).toBe('NPR');
    });

    it('should return 0.00 when no transactions exist', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue({ id: 'wallet-1', currency: 'NPR', userId: 'user-1' });
      mockPrisma.ledgerEntry.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } });

      const result = await service.getBalance('user-1');
      expect(result.balance).toBe('0.00');
    });

    it('should NEVER return a negative balance (strict mode)', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue({ id: 'wallet-1', currency: 'NPR', userId: 'user-1' });
      // Simulate a (impossible but guarded against) case where debits > credits
      mockPrisma.ledgerEntry.aggregate
        .mockResolvedValueOnce({ _sum: { amount: new Decimal(100) } }) // credits
        .mockResolvedValueOnce({ _sum: { amount: new Decimal(500) } }); // debits > credits

      const result = await service.getBalance('user-1');
      expect(parseFloat(result.balance)).toBeGreaterThanOrEqual(0);
    });

    it('should return cached balance on second call', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue({ id: 'wallet-1', currency: 'NPR', userId: 'user-1' });
      const cached = { balance: '5000.00', currency: 'NPR', walletId: 'wallet-1', lastUpdated: new Date() };
      mockRedis.get.mockResolvedValueOnce(cached);

      const result = await service.getBalance('user-1');

      expect(result.balance).toBe('5000.00');
      expect(mockPrisma.ledgerEntry.aggregate).not.toHaveBeenCalled(); // No DB hit
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 2: Idempotency — double tap = same result
  // ─────────────────────────────────────────────────────────────
  describe('Idempotency', () => {
    it('should reject duplicate idempotency keys', async () => {
      mockRedis.get.mockResolvedValueOnce({ status: 'done', statusCode: 200, body: {} });

      await expect(
        service['checkIdempotency']('duplicate-key'),
      ).rejects.toThrow('Duplicate request.');
    });

    it('should allow unique idempotency keys', async () => {
      mockRedis.get.mockResolvedValueOnce(null); // Key not found = unique

      await expect(
        service['checkIdempotency']('unique-key-123'),
      ).resolves.not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Daily limit enforcement
  // ─────────────────────────────────────────────────────────────
  describe('KYC daily limits', () => {
    it('should block transaction exceeding KYC L0 daily limit (Rs. 1000)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ kycLevel: 0 });
      mockPrisma.wallet.findUnique.mockResolvedValue({ id: 'wallet-1', userId: 'user-1' });
      // Already spent Rs. 800 today
      mockPrisma.ledgerEntry.aggregate.mockResolvedValue({
        _sum: { amount: new Decimal(800) },
      });

      // Trying to send Rs. 500 more (800 + 500 = 1300 > 1000 limit)
      await expect(
        service['checkDailyLimit']('user-1', 500),
      ).rejects.toThrow('Daily transaction limit exceeded');
    });

    it('should allow transaction within daily limit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ kycLevel: 0 });
      mockPrisma.wallet.findUnique.mockResolvedValue({ id: 'wallet-1', userId: 'user-1' });
      // Only spent Rs. 200 today
      mockPrisma.ledgerEntry.aggregate.mockResolvedValue({
        _sum: { amount: new Decimal(200) },
      });

      // Trying to send Rs. 300 (200 + 300 = 500 < 1000 limit)
      await expect(
        service['checkDailyLimit']('user-1', 300),
      ).resolves.not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Amount validation
  // ─────────────────────────────────────────────────────────────
  describe('Amount validation', () => {
    it('should reject zero amount', async () => {
      await expect(service['validateAmount'](0)).rejects.toThrow('Amount must be greater than 0');
    });

    it('should reject negative amount', async () => {
      await expect(service['validateAmount'](-100)).rejects.toThrow('Amount must be greater than 0');
    });

    it('should accept valid amounts', async () => {
      await expect(service['validateAmount'](500)).resolves.not.toThrow();
    });
  });
});
