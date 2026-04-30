import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, phone: true, fullName: true, avatarUrl: true, kycLevel: true, kycStatus: true, createdAt: true, pinHash: true },
    });
  }

  async updateProfile(id: string, data: { fullName?: string; avatarUrl?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async searchByPhone(phone: string) {
    return this.prisma.user.findFirst({
      where: { phone },
      select: { id: true, fullName: true, phone: true, avatarUrl: true },
    });
  }

  async searchByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
      select: { id: true, fullName: true, email: true, avatarUrl: true },
    });
  }

  async freezeAccount(id: string, reason: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isFrozen: true,
        freezeReason: reason,
        frozenAt: new Date(),
        isActive: false,
      },
    });
  }

  async setPin(id: string, pin: string) {
    const hashedPin = await bcrypt.hash(pin, 10);
    return this.prisma.user.update({
      where: { id },
      data: { pinHash: hashedPin },
    });
  }

  async verifyPin(id: string, pin: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { pinHash: true },
    });

    if (!user?.pinHash) {
      throw new UnauthorizedException('PIN not set');
    }

    const isValid = await bcrypt.compare(pin, user.pinHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid PIN');
    }

    return { success: true };
  }
}
