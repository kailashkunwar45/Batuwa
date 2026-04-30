import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { KycStatus, KycRiskLevel } from '@prisma/client';
import { createWorker } from 'tesseract.js';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getStatus(userId: string) {
    return this.prisma.kYC.findUnique({ where: { userId } });
  }

  async submitLevel1(userId: string, data: { fullName: string; phone: string }) {
    const kyc = await this.prisma.kYC.update({
      where: { userId },
      data: { ...data, level: 1, status: KycStatus.APPROVED },
    });
    await this.prisma.user.update({ where: { id: userId }, data: { kycLevel: 1, kycStatus: KycStatus.APPROVED, fullName: data.fullName } });
    return kyc;
  }

  async submitLevel2(userId: string, data: {
    dob: Date; address: string; citizenshipNo: string;
    citizenshipFrontUrl: string; citizenshipBackUrl: string; selfieUrl: string;
  }) {
    const kyc = await this.prisma.kYC.update({
      where: { userId },
      data: { ...data, level: 2, status: KycStatus.UNDER_REVIEW, submittedAt: new Date() },
    });
    
    // Trigger OCR in background
    this.processOcr(userId).catch(err => this.logger.error(`OCR Failed for ${userId}: ${err.message}`));

    await this.notifications.sendPush(userId, { title: 'KYC Submitted', body: 'Your KYC documents are under review. Usually takes 24 hours.', type: 'KYC' });
    return kyc;
  }

  async processOcr(userId: string) {
    const kyc = await this.prisma.kYC.findUnique({ where: { userId } });
    if (!kyc?.citizenshipFrontUrl) return;

    this.logger.log(`Starting OCR for user ${userId}...`);
    
    try {
      const worker = await createWorker('eng');
      const { data: { text, confidence } } = await worker.recognize(kyc.citizenshipFrontUrl);
      await worker.terminate();

      // Basic parsing logic (improved as we see more document samples)
      const ocrExtracted = {
        rawText: text,
        extractedName: this.parseName(text),
        extractedDob: this.parseDob(text),
        extractedNo: this.parseCitizenshipNo(text),
      };

      await this.prisma.kYC.update({
        where: { userId },
        data: { 
          ocrExtracted,
          ocrConfidence: confidence,
        },
      });

      this.logger.log(`OCR Completed for ${userId} with ${confidence}% confidence.`);
    } catch (error) {
      this.logger.error(`OCR Error: ${error.message}`);
      throw error;
    }
  }

  private parseName(text: string): string | null {
    // Improved logic for Nepali documents
    const match = text.match(/Full Name:?\s*([A-Z.\s]+)/i) || 
                  text.match(/Name:?\s*([A-Z.\s]+)/i) ||
                  text.match(/([A-Z\s]{5,30})\n/); // Fallback to first long uppercase string
    return match ? match[1].trim() : null;
  }

  private parseDob(text: string): string | null {
    // Match common formats in Nepal (YYYY/MM/DD, DD-MM-YYYY)
    const match = text.match(/(\d{4}[-/]\d{2}[-/]\d{2})/i) || 
                  text.match(/(\d{2}[-/]\d{2}[-/]\d{4})/i);
    return match ? match[1] : null;
  }

  private parseCitizenshipNo(text: string): string | null {
    // Citizenship No often starts with "No:" or follows a pattern like 12-34-56-789
    const match = text.match(/No:?\s*([\d/-]+)/i) ||
                  text.match(/(\d{2}-\d{2}-\d{2}-\d{5})/);
    return match ? match[1] : null;
  }

  async approve(userId: string, adminId: string, note?: string) {
    const kyc = await this.prisma.kYC.update({
      where: { userId },
      data: { status: KycStatus.APPROVED, reviewedBy: adminId, reviewNote: note, reviewedAt: new Date() },
    });
    const level = kyc.level;
    await this.prisma.user.update({ where: { id: userId }, data: { kycLevel: level, kycStatus: KycStatus.APPROVED } });
    await this.notifications.sendPush(userId, { title: '✅ KYC Approved!', body: `Your KYC Level ${level} has been approved. Higher limits unlocked!`, type: 'KYC' });
    return kyc;
  }

  async reject(userId: string, adminId: string, reason: string) {
    const kyc = await this.prisma.kYC.update({
      where: { userId },
      data: { status: KycStatus.REJECTED, reviewedBy: adminId, reviewNote: reason, reviewedAt: new Date() },
    });
    await this.notifications.sendPush(userId, { title: '❌ KYC Rejected', body: `Reason: ${reason}. Please resubmit.`, type: 'KYC' });
    return kyc;
  }

  async getPendingReviews(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.kYC.findMany({ where: { status: KycStatus.UNDER_REVIEW }, skip, take: limit, orderBy: { submittedAt: 'asc' }, include: { user: { select: { id: true, email: true, fullName: true } } } }),
      this.prisma.kYC.count({ where: { status: KycStatus.UNDER_REVIEW } }),
    ]);
    return { items, total, page, limit };
  }
}
