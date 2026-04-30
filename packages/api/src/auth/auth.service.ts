import {
  Injectable, UnauthorizedException, BadRequestException,
  ConflictException, Logger, ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OtpType } from '@prisma/client';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as dayjs from 'dayjs';

interface DeviceInfo {
  fingerprint?: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_REDIS_PREFIX = 'otp:';
  private readonly SESSION_REDIS_PREFIX = 'session:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // SEND OTP
  // ──────────────────────────────────────────────────────────────
  async sendOtp(dto: SendOtpDto): Promise<{ message: string; expiresIn: number }> {
    const { target, type } = dto;
    const redisKey = `${this.OTP_REDIS_PREFIX}${target}:${type}`;

    // Check rate limit (max 3 OTPs per 5 minutes per target)
    const attempts = await this.redis.get<number>(`otp_rate:${target}`);
    if (attempts && attempts >= 3) {
      throw new BadRequestException('Too many OTP requests. Please wait 5 minutes.');
    }

    // Generate OTP
    const otpTestMode = this.config.get<boolean>('OTP_TEST_MODE');
    const code = otpTestMode
      ? this.config.get<string>('OTP_TEST_CODE', '123456')
      : this.generateOtpCode();

    const expiresMinutes = this.config.get<number>('OTP_EXPIRES_MINUTES', 5);
    const expiresAt = dayjs().add(expiresMinutes, 'minute').toDate();

    // Store OTP in Redis (fast) + DB (audit)
    await this.redis.set(
      redisKey,
      { code, attempts: 0, expiresAt: expiresAt.toISOString() },
      expiresMinutes * 60,
    );

    // Also persist in DB for audit trails
    await this.prisma.oTP.create({
      data: { target, code, type, expiresAt },
    });

    // Increment rate limit counter
    await this.redis.incr(`otp_rate:${target}`, 300); // 5 min window

    // Send OTP
    if (target.includes('@')) {
      await this.notifications.sendOtpEmail(target, code);
    } else if (this.config.get<boolean>('SMS_ENABLED')) {
      await this.notifications.sendOtpSms(target, code);
    }

    this.logger.log(`OTP sent to ${otpTestMode ? target : target.replace(/.(?=.{4})/g, '*')}`);

    return {
      message: otpTestMode
        ? `[TEST MODE] OTP is: ${code}`
        : 'OTP sent successfully. Valid for 5 minutes.',
      expiresIn: expiresMinutes * 60,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // VERIFY OTP → issue JWT tokens
  // ──────────────────────────────────────────────────────────────
  async verifyOtp(
    dto: VerifyOtpDto,
    deviceInfo: DeviceInfo,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: object;
    isNewUser: boolean;
  }> {
    const { target, code, type } = dto;
    const redisKey = `${this.OTP_REDIS_PREFIX}${target}:${type}`;

    // Get OTP from Redis
    const storedOtp = await this.redis.get<{
      code: string;
      attempts: number;
      expiresAt: string;
    }>(redisKey);

    if (!storedOtp) {
      throw new UnauthorizedException('OTP expired or not found. Please request a new one.');
    }

    // Check expiry
    if (dayjs().isAfter(dayjs(storedOtp.expiresAt))) {
      await this.redis.del(redisKey);
      throw new UnauthorizedException('OTP has expired. Please request a new one.');
    }

    // Check max attempts
    const maxAttempts = this.config.get<number>('OTP_MAX_ATTEMPTS', 3);
    if (storedOtp.attempts >= maxAttempts) {
      await this.redis.del(redisKey);
      throw new UnauthorizedException('Maximum OTP attempts exceeded. Please request a new one.');
    }

    // Verify code
    if (storedOtp.code !== code) {
      storedOtp.attempts += 1;
      await this.redis.set(
        redisKey,
        storedOtp,
        dayjs(storedOtp.expiresAt).diff(dayjs(), 'second'),
      );
      throw new UnauthorizedException(
        `Invalid OTP. ${maxAttempts - storedOtp.attempts} attempts remaining.`,
      );
    }

    // OTP valid — delete it (one-time use)
    await this.redis.del(redisKey);
    await this.prisma.oTP.updateMany({
      where: { target, type, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Find or create user
    const { user, isNewUser } = await this.findOrCreateUser(target);

    // Register/update device
    if (deviceInfo.fingerprint) {
      await this.upsertDevice(user.id, deviceInfo);
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user.id, deviceInfo);

    this.logger.log(`User ${user.id} authenticated from ${deviceInfo.ipAddress || 'unknown IP'}`);

    return {
      accessToken,
      refreshToken,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        kycLevel: user.kycLevel,
        kycStatus: user.kycStatus,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  // ──────────────────────────────────────────────────────────────
  // REFRESH TOKENS (rotating refresh tokens)
  // ──────────────────────────────────────────────────────────────
  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Find session
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (dayjs().isAfter(dayjs(session.expiresAt))) {
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Refresh token expired. Please login again.');
    }

    if (!session.user.isActive || session.user.isFrozen) {
      throw new ForbiddenException('Account is not active.');
    }

    // Rotate: delete old session, issue new tokens
    await this.prisma.session.delete({ where: { id: session.id } });
    const tokens = await this.generateTokens(session.userId, {
      deviceName: session.deviceName ?? undefined,
      ipAddress: session.ipAddress ?? undefined,
      userAgent: session.userAgent ?? undefined,
    });

    return tokens;
  }

  // ──────────────────────────────────────────────────────────────
  // LOGOUT
  // ──────────────────────────────────────────────────────────────
  async logout(userId: string, refreshToken: string): Promise<{ message: string }> {
    await this.prisma.session.deleteMany({
      where: { userId, refreshToken },
    });
    return { message: 'Logged out successfully.' };
  }

  async logoutAll(userId: string): Promise<{ message: string; sessionsRevoked: number }> {
    const { count } = await this.prisma.session.deleteMany({ where: { userId } });
    return { message: 'All sessions revoked.', sessionsRevoked: count };
  }

  // ──────────────────────────────────────────────────────────────
  // ACTIVE SESSIONS
  // ──────────────────────────────────────────────────────────────
  async getActiveSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        deviceName: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string): Promise<{ message: string }> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new BadRequestException('Session not found.');
    }
    await this.prisma.session.delete({ where: { id: sessionId } });
    return { message: 'Session revoked successfully.' };
  }

  // ──────────────────────────────────────────────────────────────
  // ACCOUNT RECOVERY
  // ──────────────────────────────────────────────────────────────
  async initiateRecovery(dto: SendOtpDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: dto.target.includes('@')
        ? { email: dto.target }
        : { phone: dto.target },
    });

    if (!user) {
      // Don't reveal if user exists (security)
      return { message: 'If an account exists, a recovery code has been sent.' };
    }

    await this.sendOtp({ ...dto, type: OtpType.RESET_PASSWORD });
    return { message: 'Recovery code sent. Valid for 5 minutes.' };
  }

  // ──────────────────────────────────────────────────────────────
  // GET ME
  // ──────────────────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        avatarUrl: true,
        kycLevel: true,
        kycStatus: true,
        kycRiskLevel: true,
        financialScore: true,
        referralCode: true,
        createdAt: true,
        wallet: { select: { id: true, currency: true } },
      },
    });
    if (!user) throw new UnauthorizedException('User not found.');
    return user;
  }

  // ──────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────────────────────
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async findOrCreateUser(target: string): Promise<{
    user: any;
    isNewUser: boolean;
  }> {
    const isEmail = target.includes('@');
    const existing = await this.prisma.user.findFirst({
      where: isEmail ? { email: target } : { phone: target },
    });

    if (existing) {
      return { user: existing, isNewUser: false };
    }

    // Create new user + wallet in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          ...(isEmail ? { email: target } : { email: `user_${uuidv4()}@temp.kkollection.com`, phone: target }),
          ...(isEmail ? {} : { phone: target }),
          referralCode: this.generateReferralCode(),
        },
      });

      // Create wallet immediately
      await tx.wallet.create({
        data: { userId: newUser.id },
      });

      // Create KYC record
      await tx.kYC.create({
        data: { userId: newUser.id },
      });

      // Create risk profile
      await tx.riskProfile.create({
        data: { userId: newUser.id },
      });

      return newUser;
    });

    this.logger.log(`New user registered: ${user.id}`);
    return { user, isNewUser: true };
  }

  private async generateTokens(
    userId: string,
    deviceInfo: DeviceInfo,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwt.sign(
      { sub: userId, version: this.config.get('JWT_KEY_VERSION') },
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      },
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN', '30d');
    const expiresAt = dayjs().add(30, 'day').toDate();

    await this.prisma.session.create({
      data: {
        userId,
        deviceName: deviceInfo.deviceName,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private async upsertDevice(userId: string, deviceInfo: DeviceInfo): Promise<void> {
    if (!deviceInfo.fingerprint) return;

    await this.prisma.device.upsert({
      where: { fingerprint: deviceInfo.fingerprint },
      update: {
        lastSeenAt: new Date(),
        fcmToken: undefined,
      },
      create: {
        userId,
        fingerprint: deviceInfo.fingerprint,
        deviceType: deviceInfo.deviceName,
      },
    });
  }

  private generateReferralCode(): string {
    return `KK${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
}
