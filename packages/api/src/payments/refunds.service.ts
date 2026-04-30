import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsService } from '../events/events.service';
import { RefundType, RefundStatus, TxnStatus, EntryType, TxnCategory } from '@prisma/client';
import { Decimal } from 'decimal.js';

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly notifications: NotificationsService,
    private readonly events: EventsService,
  ) {}

  async requestRefund(
    userId: string,
    dto: { transactionId: string; reason: string; amount?: number },
  ) {
    const wallet = await this.wallet.getWalletByUserId(userId);

    const txn = await this.prisma.transaction.findFirst({
      where: { id: dto.transactionId, fromWalletId: wallet.id, status: TxnStatus.SUCCESS },
    });

    if (!txn) throw new NotFoundException('Transaction not found or not eligible for refund.');

    // Check no existing refund
    const existingRefund = await this.prisma.refund.findFirst({
      where: { transactionId: dto.transactionId, status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'PROCESSED'] } },
    });
    if (existingRefund) throw new BadRequestException('A refund is already in progress for this transaction.');

    const refundAmount = dto.amount || txn.amount;
    const isPartial = refundAmount < txn.amount;

    if (refundAmount > txn.amount) {
      throw new BadRequestException('Refund amount cannot exceed original transaction amount.');
    }

    // Check time limit (24 hours for auto-approve, 7 days for manual review)
    const txnAge = Date.now() - new Date(txn.createdAt).getTime();
    const hoursOld = txnAge / (1000 * 60 * 60);

    const refund = await this.prisma.refund.create({
      data: {
        transactionId: dto.transactionId,
        amount: refundAmount,
        type: isPartial ? RefundType.PARTIAL : RefundType.FULL,
        reason: dto.reason,
        status: RefundStatus.PENDING,
        initiatedBy: userId,
      },
    });

    // Auto-approve if < 1 hour old (no human review needed)
    if (hoursOld < 1) {
      await this.processRefund(refund.id, 'SYSTEM');
    }

    return refund;
  }

  async processRefund(refundId: string, processedBy: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: { transaction: true },
    });
    if (!refund) throw new NotFoundException('Refund not found.');

    // Find the wallet that was debited
    const walletId = refund.transaction.fromWalletId!;
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found.');

    await this.prisma.$transaction(async (tx) => {
      // CREDIT back the refunded amount
      await tx.ledgerEntry.create({
        data: {
          walletId,
          type: EntryType.CREDIT,
          amount: refund.amount,
          reference: `refund:${refundId}`,
          transactionId: refund.transactionId,
          description: `Refund: ${refund.reason}`,
          category: TxnCategory.TRANSFER,
        },
      });

      // Update refund status
      await tx.refund.update({
        where: { id: refundId },
        data: { status: RefundStatus.PROCESSED, processedAt: new Date() },
      });

      // Update original transaction
      await tx.transaction.update({
        where: { id: refund.transactionId },
        data: { status: refund.type === RefundType.FULL ? TxnStatus.REFUNDED : TxnStatus.SUCCESS },
      });
    });

    await this.wallet.invalidateBalanceCache(wallet.userId);

    await this.notifications.sendPush(wallet.userId, {
      title: '💸 Refund Processed',
      body: `Rs.${refund.amount} refunded to your wallet.`,
      type: 'PAYMENT',
    });

    await this.events.publish('REFUND_PROCESSED', { userId: wallet.userId, refundId, amount: refund.amount });

    this.logger.log(`Refund ${refundId} processed: Rs.${refund.amount} → wallet ${walletId}`);
    return this.prisma.refund.findUnique({ where: { id: refundId } });
  }

  async getUserRefunds(userId: string) {
    const wallet = await this.wallet.getWalletByUserId(userId);
    return this.prisma.refund.findMany({
      where: { transaction: { fromWalletId: wallet.id } },
      include: { transaction: { select: { id: true, amount: true, billProvider: true, billRef: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
