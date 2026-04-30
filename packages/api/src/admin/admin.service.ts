import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly notifications: NotificationsService,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalTransactions, activeUsers, pendingKyc, openFraudAlerts] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.transaction.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.kYC.count({ where: { status: 'UNDER_REVIEW' } }),
      this.prisma.fraudAlert.count({ where: { status: 'OPEN' } }),
    ]);
    return { totalUsers, totalTransactions, activeUsers, pendingKyc, openFraudAlerts };
  }

  async freezeUser(userId: string, adminId: string, reason: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isFrozen: true, freezeReason: reason, frozenAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: { adminId, action: 'FREEZE_USER', targetId: userId, targetType: 'USER', reason },
    });
    await this.notifications.sendPush(userId, { title: '⚠️ Account Frozen', body: `Your account has been temporarily frozen. Contact support.`, type: 'ALERT' });
    return user;
  }

  async unfreezeUser(userId: string, adminId: string, reason?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isFrozen: false, freezeReason: null, frozenAt: null },
    });
    await this.prisma.auditLog.create({
      data: { adminId, action: 'UNFREEZE_USER', targetId: userId, targetType: 'USER', reason },
    });
    await this.notifications.sendPush(userId, { title: '✅ Account Active', body: 'Your account has been reactivated.', type: 'ALERT' });
    return user;
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ];
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, email: true, fullName: true, phone: true, kycLevel: true, isActive: true, isFrozen: true, createdAt: true } }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total };
  }

  async getTransactionFeed(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' }, include: { lifecycle: { orderBy: { timestamp: 'desc' }, take: 1 } } }),
      this.prisma.transaction.count(),
    ]);
    return { items, total };
  }
}
