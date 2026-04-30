import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, data: { businessName: string; businessType?: string; businessAddress?: string }) {
    const existing = await this.prisma.merchant.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Already registered as merchant.');

    const qrCode = `KKM-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    return this.prisma.merchant.create({ data: { userId, ...data, qrCode } });
  }

  async getProfile(userId: string) {
    return this.prisma.merchant.findUnique({ where: { userId } });
  }

  async findByQr(qrCode: string) {
    return this.prisma.merchant.findUnique({ 
      where: { qrCode },
      select: { id: true, businessName: true, businessType: true, isVerified: true }
    });
  }

  async processPayment(qrCode: string, amount: number, fromUserId: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { qrCode } });
    if (!merchant) throw new ConflictException('Invalid Merchant QR.');

    // This would trigger a ledger transfer via WalletService
    // For now, we update merchant stats
    return this.prisma.merchant.update({
      where: { id: merchant.id },
      data: { 
        totalVolume: { increment: amount },
        totalTxnCount: { increment: 1 }
      }
    });
  }
}
