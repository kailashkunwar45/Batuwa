import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

export interface StorageAdapter {
  upload(buffer: Buffer, path: string, mimeType?: string): Promise<string>;
  getUrl(publicId: string): string;
  delete(publicId: string): Promise<void>;
}

@Injectable()
export class StorageService implements StorageAdapter {
  private readonly logger = new Logger(StorageService.name);
  private cloudinaryConfigured = false;

  constructor(private readonly config: ConfigService) {
    this.initCloudinary();
  }

  private initCloudinary() {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME', '');
    if (!cloudName || cloudName === 'REPLACE_WITH_YOUR_CLOUD_NAME') {
      this.logger.warn('⚠️  Cloudinary not configured — files will be stored locally (dev)');
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
    this.cloudinaryConfigured = true;
    this.logger.log('✅ Cloudinary initialized');
  }

  async upload(buffer: Buffer, path: string, mimeType?: string): Promise<string> {
    if (!this.cloudinaryConfigured) {
      // Dev fallback — return a mock URL
      const mockId = crypto.randomBytes(8).toString('hex');
      this.logger.log(`[STORAGE MOCK] Would upload to: ${path} (${mockId})`);
      return `https://res.cloudinary.com/mock/${path}/${mockId}`;
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: `kkollection/${path}`, resource_type: 'auto' },
          (error, result?: UploadApiResponse) => {
            if (error) return reject(error);
            resolve(result!.secure_url);
          },
        )
        .end(buffer);
    });
  }

  getUrl(publicId: string): string {
    return cloudinary.url(publicId, { secure: true });
  }

  async delete(publicId: string): Promise<void> {
    if (!this.cloudinaryConfigured) return;
    await cloudinary.uploader.destroy(publicId);
  }

  // ─── QR Code Generation ────────────────────────────────────
  async generateQRCode(data: string): Promise<Buffer> {
    return QRCode.toBuffer(data, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: '#0B0F1A', light: '#FFFFFF' },
    });
  }

  async generateAndUploadQR(userId: string, walletId: string): Promise<string> {
    const qrData = JSON.stringify({
      type: 'kkollection_pay',
      userId,
      walletId,
      ts: Date.now(),
    });

    const buffer = await this.generateQRCode(qrData);
    return this.upload(buffer, `qr/${userId}`, 'image/png');
  }

  async uploadKYCDocument(buffer: Buffer, userId: string, docType: string): Promise<string> {
    return this.upload(buffer, `kyc/${userId}/${docType}`, 'image/jpeg');
  }

  async uploadReceipt(buffer: Buffer, transactionId: string): Promise<string> {
    return this.upload(buffer, `receipts/${transactionId}`, 'application/pdf');
  }
}
