import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class getRequestDto {
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  provider?: string;
}
