import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EntryType, TxnCategory } from '@prisma/client';

export class StatementQueryDto {
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsEnum(EntryType) type?: EntryType;
  @IsOptional() @IsEnum(TxnCategory) category?: TxnCategory;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) limit?: number = 20;
}
