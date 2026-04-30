import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMoneyDto {
  @ApiProperty({ example: 500, description: 'Amount in NPR' })
  @IsNumber()
  @Min(1)
  @Max(500000)
  amount: number;

  @ApiProperty({ example: '+9779812345678', required: false })
  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @ApiProperty({ example: 'recipient@example.com', required: false })
  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @ApiProperty({ example: 'For dinner', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
