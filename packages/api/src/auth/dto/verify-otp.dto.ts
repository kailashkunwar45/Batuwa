import { IsEnum, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OtpType } from '@prisma/client';

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  target: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  code: string;

  @ApiProperty({ enum: OtpType, example: OtpType.LOGIN })
  @IsEnum(OtpType)
  type: OtpType = OtpType.LOGIN;
}
