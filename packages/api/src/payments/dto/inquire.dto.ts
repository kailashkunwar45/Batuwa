import { IsString, IsOptional } from 'class-validator';

export class InquireDto {
  @IsString() providerId: string;
  @IsString() accountRef: string;
  @IsOptional() params?: Record<string, string>;
}
