import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { TxnCategory } from '@prisma/client';
import { UsersService } from '../users/users.service';

describe('AiService', () => {
  let service: AiService;

  const mockPrisma = {
    wallet: { findUnique: jest.fn() },
    ledgerEntry: { groupBy: jest.fn(), aggregate: jest.fn() },
    transaction: { count: jest.fn() },
    vault: { count: jest.fn() },
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue(false),
  };

  const mockUsersService = {
    freezeAccount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  describe('categorizeTransaction', () => {
    it('should categorize NCELL as BILLS', async () => {
      const category = await service.categorizeTransaction('NCELL Top-up', 500);
      expect(category).toBe(TxnCategory.BILLS);
    });

    it('should categorize restaurant as FOOD', async () => {
      const category = await service.categorizeTransaction('Lunch at Burger King', 1200);
      expect(category).toBe(TxnCategory.FOOD);
    });

    it('should fallback to OTHER', async () => {
      const category = await service.categorizeTransaction('Misc purchase', 100);
      expect(category).toBe(TxnCategory.OTHER);
    });
  });

  describe('generateTip', () => {
    it('should give tip for increasing spending', () => {
      const categories = [{ category: 'FOOD', amount: 5000, changePercent: 20, trend: 'up' }];
      const tip = (service as any).generateTip(categories);
      expect(tip).toContain('spending is up');
    });
  });
});
