import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayBillDto {
  @ApiProperty({ example: 'NEA_PREPAID' })
  @IsString() providerId: string;

  @ApiProperty({ example: '01-23-456' })
  @IsString() accountRef: string;

  @ApiProperty({ example: 500 })
  @IsNumber() @Min(1) amount: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() note?: string;

  @IsOptional() params?: Record<string, string>;
}
