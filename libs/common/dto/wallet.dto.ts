import {
  IsString,
  IsNumber,
  IsObject,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class WalletAuthDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  gameId!: string;

  @IsNumber()
  channel?: number;

  @IsString()
  @IsNotEmpty()
  ip: string | undefined;

  @IsObject()
  @IsOptional()
  launchVars?: Record<string, any>;

  @IsNumber()
  @IsNotEmpty()
  date?: number;

  @IsString()
  @IsNotEmpty()
  sign!: string;
}
