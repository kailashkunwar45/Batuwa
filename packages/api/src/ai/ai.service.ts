import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EntryType, TxnCategory } from '@prisma/client';
import * as dayjs from 'dayjs';

// ═══════════════════════════════════════════════════════════════
// AI Service — Rule-based engine (Phase 4)
// No OpenAI cost. Swap in Phase 6 by changing AI_ENGINE=openai
// ═══════════════════════════════════════════════════════════════

import { UsersService } from '../users/users.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {}

  async getSpendingInsights(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return null;

    const thisMonth = dayjs().startOf('month').toDate();
    const lastMonth = dayjs().subtract(1, 'month').startOf('month').toDate();
    const lastMonthEnd = dayjs().startOf('month').toDate();

    const [thisMonthDebits, lastMonthDebits] = await Promise.all([
      this.prisma.ledgerEntry.groupBy({
        by: ['category'],
        where: { walletId: wallet.id, type: EntryType.DEBIT, createdAt: { gte: thisMonth } },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.groupBy({
        by: ['category'],
        where: { walletId: wallet.id, type: EntryType.DEBIT, createdAt: { gte: lastMonth, lt: lastMonthEnd } },
        _sum: { amount: true },
      }),
    ]);

    const categories = thisMonthDebits.map((item) => {
      const last = lastMonthDebits.find((l) => l.category === item.category);
      const thisAmt = item._sum.amount || 0;
      const lastAmt = last?._sum.amount || 0;
      const change = lastAmt > 0 ? ((thisAmt - lastAmt) / lastAmt) * 100 : 0;
      return { category: item.category, amount: thisAmt, changePercent: Math.round(change), trend: change > 0 ? 'up' : 'down' };
    });

    const totalSpent = categories.reduce((sum, c) => sum + c.amount, 0);
    const tip = this.generateTip(categories);

    return { categories, totalSpent, period: dayjs().format('MMMM YYYY'), tip };
  }

  async getFinancialHealthScore(userId: string): Promise<{
    score: number; grade: string; components: Record<string, number>; advice: string;
  }> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return { score: 0, grade: 'N/A', components: {}, advice: 'Start using your wallet to get a health score.' };

    const last30 = dayjs().subtract(30, 'day').toDate();
    const [credits, debits, txnCount, vaults] = await Promise.all([
      this.prisma.ledgerEntry.aggregate({ where: { walletId: wallet.id, type: EntryType.CREDIT, createdAt: { gte: last30 } }, _sum: { amount: true } }),
      this.prisma.ledgerEntry.aggregate({ where: { walletId: wallet.id, type: EntryType.DEBIT, createdAt: { gte: last30 } }, _sum: { amount: true } }),
      this.prisma.transaction.count({ where: { OR: [{ fromWalletId: wallet.id }, { toWalletId: wallet.id }], status: 'SUCCESS', createdAt: { gte: last30 } } }),
      this.prisma.vault.count({ where: { walletId: wallet.id } }),
    ]);

    const income = credits._sum.amount || 0;
    const expense = debits._sum.amount || 0;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    const components = {
      savingsRate: Math.min(Math.max(savingsRate, 0), 100),
      transactionActivity: Math.min(txnCount * 5, 100),
      vaultUsage: Math.min(vaults * 25, 100),
      spendingControl: expense < income ? 100 : Math.max(100 - ((expense - income) / (income || 1)) * 100, 0),
    };

    const score = Math.round(Object.values(components).reduce((a, b) => a + b, 0) / 4);
    const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';

    return { score, grade, components, advice: this.getHealthAdvice(score, components) };
  }

  private generateTip(categories: any[]): string {
    const topCategory = categories.sort((a, b) => b.amount - a.amount)[0];
    if (!topCategory) return '💡 Start tracking expenses to get personalized tips.';
    if (topCategory.trend === 'up') return `💡 Your ${topCategory.category.toLowerCase()} spending is up ${topCategory.changePercent}%. Consider setting a budget.`;
    return `✅ Great job! Your ${topCategory.category.toLowerCase()} spending is ${Math.abs(topCategory.changePercent)}% lower than last month.`;
  }

  private getHealthAdvice(score: number, components: Record<string, number>): string {
    if (score >= 80) return '🌟 Excellent financial health! Keep saving consistently.';
    if (components.savingsRate < 20) return '💡 Try to save at least 20% of your income each month.';
    if (components.vaultUsage < 25) return '💡 Create a savings vault for your goals to improve your score.';
    return '📈 Make regular transactions and maintain healthy spending habits.';
  }

  async categorizeTransaction(description: string, amount: number): Promise<TxnCategory> {
    const d = description.toLowerCase();
    if (d.includes('ncell') || d.includes('ntc') || d.includes('mobile')) return TxnCategory.BILLS;
    if (d.includes('nea') || d.includes('electricity')) return TxnCategory.BILLS;
    if (d.includes('worldlink') || d.includes('vianet') || d.includes('internet')) return TxnCategory.BILLS;
    if (d.includes('food') || d.includes('restaurant') || d.includes('cafe') || d.includes('burger') || d.includes('lunch')) return TxnCategory.FOOD;
    if (d.includes('taxi') || d.includes('bus') || d.includes('transport')) return TxnCategory.TRANSPORT;
    if (d.includes('school') || d.includes('college') || d.includes('university')) return TxnCategory.EDUCATION;
    if (d.includes('hospital') || d.includes('clinic') || d.includes('health')) return TxnCategory.HEALTH;
    if (d.includes('sent') || d.includes('transfer') || d.includes('received')) return TxnCategory.TRANSFER;
    return TxnCategory.OTHER;
  }

  async checkFraudRisk(userId: string, amount: number): Promise<{ riskScore: number; reason: string | null; isBlocked: boolean }> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return { riskScore: 0, reason: null, isBlocked: false };

    const result = { riskScore: 0.1, reason: null as string | null, isBlocked: false };

    // Rule 1: Large Amount Check
    if (amount > 100000) {
      result.riskScore = 0.8;
      result.reason = 'High-value transaction detected.';
    }

    // Rule 2: Velocity Check
    const fiveMinAgo = dayjs().subtract(5, 'minute').toDate();
    const recentTxns = await this.prisma.transaction.count({
      where: { fromWalletId: wallet.id, createdAt: { gte: fiveMinAgo } }
    });

    if (recentTxns > 5) {
      result.riskScore = 0.95;
      result.reason = 'Velocity breach: Too many transactions in 5 minutes.';
      result.isBlocked = true;
    }

    // AUTO-FREEZE ENFORCEMENT
    if (result.riskScore > 0.85) {
      await this.users.freezeAccount(userId, `AI Guardian: ${result.reason}`);
      this.logger.warn(`🛑 ACCOUNT FROZEN for user ${userId} due to high fraud risk: ${result.reason}`);
    }

    return result;
  }
}
