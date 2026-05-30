import {
  IsString,
  IsNumber,
  IsObject,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
  IsBoolean,
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
export class DebitRequestDto {
  @IsString()
  playerId!: string;

  @IsString()
  gameId!: string;

  @IsString()
  currency!: string;

  @IsString()
  roundId!: string;

  @IsNumber()
  @Min(1)
  @Max(2)
  channel?: number;

  @IsString()
  transactionId?: string;

  @IsNumber()
  @Min(1)
  amount?: number;

  @IsBoolean()
  isRoundFinished?: boolean;

  @IsOptional()
  @IsObject()
  sessionState?: any;

  @IsNumber()
  date?: number;

  @IsString()
  sign?: string;

  @IsOptional()
  @IsObject()
  additionalData?: {
    roundCreatedAt?: string;
    roundUpdatedAt?: string;
    awardAdditionalData?: any;
    awardData?: any;
    campaignType?: 'FREESPIN' | 'TOURNAMENT';
    awardId?: string;
  };

  @IsOptional()
  @IsString()
  transactionProviderPrefix?: string;
}
