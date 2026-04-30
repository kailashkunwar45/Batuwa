import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as sgMail from '@sendgrid/mail';
import * as admin from 'firebase-admin';

interface PushPayload {
  title: string;
  body: string;
  type: string;
  data?: Record<string, string>;
  deepLink?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.initSendGrid();
    this.initFirebase();
  }

  private initSendGrid() {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    if (apiKey && apiKey !== 'SG.REPLACE_WITH_YOUR_SENDGRID_KEY') {
      sgMail.setApiKey(apiKey);
      this.logger.log('✅ SendGrid initialized');
    } else {
      this.logger.warn('⚠️  SendGrid not configured — emails will be logged only');
    }
  }

  private initFirebase() {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    if (!projectId || projectId === 'REPLACE_WITH_YOUR_PROJECT_ID') {
      this.logger.warn('⚠️  Firebase not configured — push notifications disabled');
      return;
    }
    try {
      if (!admin.apps.length) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail: this.config.get<string>('FIREBASE_CLIENT_EMAIL'),
            privateKey: this.config.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
          }),
        });
        this.logger.log('✅ Firebase FCM initialized');
      }
    } catch (err) {
      this.logger.error('Firebase init failed:', err);
    }
  }

  // ─── Send OTP Email ───────────────────────────────────────────
  async sendOtpEmail(to: string, code: string): Promise<void> {
    const subject = 'Your K-Kollection Verification Code';
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0B0F1A; color: #E8EAF0; border-radius: 16px;">
        <h1 style="color: #4F7CFF; margin-bottom: 8px;">K-Kollection</h1>
        <p style="color: #6B7280; margin-bottom: 24px;">Financial OS for Nepal</p>
        <h2 style="font-size: 18px; margin-bottom: 16px;">Your Verification Code</h2>
        <div style="background: #131929; border: 1px solid #1E2740; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #4F7CFF; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #6B7280; font-size: 14px;">Valid for 5 minutes. Never share this code.</p>
        <p style="color: #FF4D4D; font-size: 12px;">If you didn't request this, ignore this email.</p>
      </div>
    `;
    await this.sendEmail(to, subject, html);
  }

  // ─── Send Generic Email ───────────────────────────────────────
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const from = this.config.get<string>('EMAIL_FROM', 'noreply@kkollection.com');
    const fromName = this.config.get<string>('EMAIL_FROM_NAME', 'K-Kollection');
    const apiKey = this.config.get<string>('SENDGRID_API_KEY', '');

    if (!apiKey || apiKey.startsWith('SG.REPLACE')) {
      this.logger.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
      return;
    }

    try {
      await sgMail.send({ to, from: { email: from, name: fromName }, subject, html });
    } catch (error: any) {
      this.logger.error(`Email failed to ${to}:`, error?.response?.body || error.message);
    }
  }

  // ─── Send OTP SMS ─────────────────────────────────────────────
  async sendOtpSms(phone: string, code: string): Promise<void> {
    if (!this.config.get<boolean>('SMS_ENABLED')) {
      this.logger.log(`[SMS MOCK] To: ${phone} | OTP: ${code}`);
      return;
    }
    // Twilio integration (Phase 2 — uncomment when Twilio creds added)
    this.logger.log(`[SMS] Would send OTP ${code} to ${phone}`);
  }

  // ─── Push Notification ────────────────────────────────────────
  async sendPush(userId: string, payload: PushPayload): Promise<void> {
    // Save to DB (always — for notification history)
    await this.prisma.notification.create({
      data: {
        userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        deepLink: payload.deepLink,
        metadata: payload.data as any,
      },
    });

    if (!this.config.get<boolean>('FCM_ENABLED') || !this.firebaseApp) {
      this.logger.log(`[PUSH MOCK] To: ${userId} | ${payload.title}: ${payload.body}`);
      return;
    }

    // Get user's FCM tokens
    const devices = await this.prisma.device.findMany({
      where: { userId, fcmToken: { not: null } },
      select: { fcmToken: true },
    });

    if (!devices.length) return;

    const tokens = devices.map((d) => d.fcmToken!).filter(Boolean);

    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title: payload.title, body: payload.body },
        data: { type: payload.type, deepLink: payload.deepLink || '', ...payload.data },
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
    } catch (error: any) {
      this.logger.error(`FCM push failed for user ${userId}:`, error.message);
    }
  }

  // ─── Mark notification read ───────────────────────────────────
  async markRead(userId: string, notificationId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  // ─── Get user notifications ───────────────────────────────────
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, total, unread, page, limit };
  }
}
