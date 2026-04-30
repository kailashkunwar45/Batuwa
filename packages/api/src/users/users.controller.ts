import { Controller, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Request() req: any) { return this.usersService.findById(req.user.id); }

  @Patch('me')
  updateProfile(@Request() req: any, @Body() body: { fullName?: string; avatarUrl?: string }) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Get('search')
  search(@Query('phone') phone?: string, @Query('email') email?: string) {
    if (phone) return this.usersService.searchByPhone(phone);
    if (email) return this.usersService.searchByEmail(email);
    return null;
  }

  @Patch('me/pin')
  setPin(@Request() req: any, @Body() body: { pin: string }) {
    return this.usersService.setPin(req.user.id, body.pin);
  }

  @Patch('me/verify-pin')
  verifyPin(@Request() req: any, @Body() body: { pin: string }) {
    return this.usersService.verifyPin(req.user.id, body.pin);
  }
}
