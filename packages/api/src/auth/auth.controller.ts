import {
  Controller, Post, Body, Get, Delete, Param,
  UseGuards, Request, HttpCode, HttpStatus, Headers,
  UnauthorizedException, ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // ─── Send OTP ────────────────────────────────────────────────
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 300000, limit: 3 } }) // 3 OTPs per 5 min
  @ApiOperation({ summary: 'Send OTP to email or phone' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 429, description: 'Too many OTP requests' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  // ─── Verify OTP → issue tokens ───────────────────────────────
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Verify OTP and get access/refresh tokens' })
  @ApiResponse({ status: 200, description: 'Returns access + refresh tokens' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Headers('x-device-fingerprint') deviceFingerprint?: string,
    @Headers('x-device-name') deviceName?: string,
    @Headers('x-forwarded-for') ipAddress?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.verifyOtp(dto, {
      fingerprint: deviceFingerprint,
      deviceName,
      ipAddress,
      userAgent,
    });
  }

  // ─── Refresh tokens ──────────────────────────────────────────
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  // ─── Logout (revoke session) ─────────────────────────────────
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current session' })
  logout(
    @Request() req: any,
    @Body() body: { refreshToken: string },
  ) {
    return this.authService.logout(req.user.id, body.refreshToken);
  }

  // ─── Logout all devices ──────────────────────────────────────
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from all devices' })
  logoutAll(@Request() req: any) {
    return this.authService.logoutAll(req.user.id);
  }

  // ─── List active sessions ────────────────────────────────────
  @Get('devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all active sessions/devices' })
  getDevices(@Request() req: any) {
    return this.authService.getActiveSessions(req.user.id);
  }

  // ─── Revoke specific session ─────────────────────────────────
  @Delete('devices/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a specific session' })
  revokeDevice(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSession(req.user.id, sessionId);
  }

  // ─── Account recovery ────────────────────────────────────────
  @Post('recover')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 300000, limit: 3 } })
  @ApiOperation({ summary: 'Initiate account recovery' })
  recover(@Body() dto: SendOtpDto) {
    return this.authService.initiateRecovery(dto);
  }

  // ─── Development Login (Instant for Test User) ───────────────
  @Post('dev-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Instant login for development test user' })
  async devLogin(@Body() dto: { target: string; password?: string }) {
    if (this.config.get('NODE_ENV') === 'production') {
      throw new ForbiddenException('Not available in production');
    }
    
    // For test user, we allow password check or just bypass for dev
    if (dto.target === 'test@batuwa.com' && dto.password !== 'password123') {
      throw new UnauthorizedException('Invalid test credentials');
    }

    // Bypass OTP by directly using AuthService logic or injecting into Redis
    // We'll use the proper flow but pre-fill the "verified" state if possible.
    // Easiest way: Inject the OTP into Redis now.
    const redisKey = `otp:${dto.target}:LOGIN`;
    await (this.authService as any).redis.set(redisKey, { 
      code: '123456', 
      attempts: 0, 
      expiresAt: new Date(Date.now() + 300000).toISOString() 
    }, 300);

    return this.authService.verifyOtp({
      target: dto.target,
      code: '123456',
      type: 'LOGIN' as any
    }, { deviceName: 'Dev Device' });
  }

  // ─── Get current user ────────────────────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user profile' })
  getMe(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }
}
