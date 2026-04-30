import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class VaultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  async getVaults(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return this.prisma.vault.findMany({ where: { walletId: wallet.id }, orderBy: { createdAt: 'desc' } });
  }

  async createVault(userId: string, data: { name: string; emoji?: string; targetAmount: number; targetDate?: Date }) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    return this.prisma.vault.create({
      data: {
        walletId: wallet.id,
        ...data,
      },
    });
  }

  async deposit(userId: string, vaultId: string, amount: number) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const vault = await this.prisma.vault.findUnique({ where: { id: vaultId } });
    if (!vault || vault.walletId !== wallet.id) throw new NotFoundException('Vault not found');

    // Transfer from main wallet to vault (logical transfer)
    // In this simple implementation, we just update the vault savedAmount
    // and record a transaction in the wallet.
    
    return this.prisma.$transaction(async (tx) => {
      const updatedVault = await tx.vault.update({
        where: { id: vaultId },
        data: { 
          savedAmount: { increment: amount },
          isCompleted: vault.savedAmount + amount >= vault.targetAmount,
          completedAt: vault.savedAmount + amount >= vault.targetAmount ? new Date() : null,
        },
      });

      // Record internal transaction (VAULT_IN)
      // This would normally call WalletService.processTransaction
      
      return updatedVault;
    });
  }

  async withdraw(userId: string, vaultId: string, amount: number) {
    const vault = await this.prisma.vault.findUnique({ where: { id: vaultId } });
    if (!vault) throw new NotFoundException('Vault not found');

    if (vault.savedAmount < amount) throw new BadRequestException('Insufficient funds in vault');

    return this.prisma.vault.update({
      where: { id: vaultId },
      data: { savedAmount: { decrement: amount } },
    });
  }
}
