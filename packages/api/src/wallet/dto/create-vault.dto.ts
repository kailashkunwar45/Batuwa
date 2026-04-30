import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateVaultDto {
  @IsString() name: string;
  @IsNumber() @Min(100) targetAmount: number;
  @IsOptional() @IsString() emoji?: string;
  @IsOptional() targetDate?: Date;
}
