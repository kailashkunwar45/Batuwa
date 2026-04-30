import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RewardType } from '@prisma/client';

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string) {
    const [points, cashback] = await Promise.all([
      this.prisma.reward.aggregate({ where: { userId, type: RewardType.POINTS, redeemedAt: null }, _sum: { points: true } }),
      this.prisma.reward.aggregate({ where: { userId, type: RewardType.CASHBACK, redeemedAt: null }, _sum: { amount: true } }),
    ]);
    return { points: points._sum.points || 0, cashback: cashback._sum.amount || 0 };
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.reward.findMany({ where: { userId }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.reward.count({ where: { userId } }),
    ]);
    return { items, total };
  }

  async award(userId: string, type: RewardType, amount: number, points: number, source: string, description?: string) {
    return this.prisma.reward.create({ data: { userId, type, amount, points, source, description } });
  }
}
