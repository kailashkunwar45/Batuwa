import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async validate(payload: { sub: string; version: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        kycLevel: true,
        kycStatus: true,
        isActive: true,
        isFrozen: true,
        freezeReason: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found.');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated.');
    if (user.isFrozen) throw new UnauthorizedException(`Account frozen: ${user.freezeReason}`);

    return user;
  }
}
