import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { TxnType } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  async getAll(userId: string, filters: { type?: TxnType; status?: string; page?: number; limit?: number; search?: string }) {
    const wallet = await this.wallet.getWalletByUserId(userId);
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { OR: [{ fromWalletId: wallet.id }, { toWalletId: wallet.id }] };
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.search) where.OR = [
      ...where.OR,
      { billRef: { contains: filters.search, mode: 'insensitive' } },
      { billProvider: { contains: filters.search, mode: 'insensitive' } },
    ];

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { lifecycle: { take: 1, orderBy: { timestamp: 'desc' } } },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getById(userId: string, id: string) {
    const wallet = await this.wallet.getWalletByUserId(userId);
    const txn = await this.prisma.transaction.findFirst({
      where: { id, OR: [{ fromWalletId: wallet.id }, { toWalletId: wallet.id }] },
      include: { lifecycle: { orderBy: { timestamp: 'asc' } } },
    });
    if (!txn) throw new NotFoundException('Transaction not found.');
    return txn;
  }

  async addNote(userId: string, id: string, note: string) {
    const txn = await this.getById(userId, id);
    return this.prisma.transaction.update({ where: { id: txn.id }, data: { note } });
  }
}
