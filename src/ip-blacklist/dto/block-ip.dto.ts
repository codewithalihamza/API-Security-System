import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BlockIpDto {
  @IsString()
  ipAddress: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPermanent?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  expiresIn?: number; // seconds
}
