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

export class WalletBallanceDto {
  @IsString()
  @IsNotEmpty()
  playerId!: string;
  @IsString()
  @IsNotEmpty()
  currency!: string;
  @IsString()
  @IsNotEmpty()
  gameId!: string;
  @IsObject()
  @IsOptional()
  sessionState?: Record<string, any>;
  @IsNumber()
  @IsNotEmpty()
  date?: number;
  @IsString()
  @IsNotEmpty()
  sign!: string;
}
