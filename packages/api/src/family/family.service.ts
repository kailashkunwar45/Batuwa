import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FamilyService {
  constructor(private readonly prisma: PrismaService) {}

  async getLinks(userId: string) {
    const [asParent, asChild] = await Promise.all([
      this.prisma.familyLink.findMany({ where: { parentId: userId, isActive: true }, include: { child: { select: { id: true, fullName: true, email: true, phone: true } } } }),
      this.prisma.familyLink.findMany({ where: { childId: userId, isActive: true }, include: { parent: { select: { id: true, fullName: true, email: true } } } }),
    ]);
    return { asParent, asChild };
  }

  async linkMember(parentId: string, childId: string, limits: { dailyLimit?: number; monthlyLimit?: number; allowedCategories?: string[] }) {
    if (parentId === childId) throw new BadRequestException('Cannot link yourself.');
    return this.prisma.familyLink.upsert({
      where: { parentId_childId: { parentId, childId } },
      create: { parentId, childId, ...limits },
      update: { ...limits, isActive: true },
    });
  }

  async removeLink(parentId: string, childId: string) {
    return this.prisma.familyLink.updateMany({ where: { parentId, childId }, data: { isActive: false } });
  }
}
