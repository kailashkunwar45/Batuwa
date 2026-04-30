import { IsEmail, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OtpType } from '@prisma/client';

export class SendOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email or phone number' })
  @IsString()
  target: string;

  @ApiProperty({ enum: OtpType, example: OtpType.LOGIN })
  @IsEnum(OtpType)
  type: OtpType = OtpType.LOGIN;
}
