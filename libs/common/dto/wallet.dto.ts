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
  amount!: number;

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
export class CreditRequestDto {
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
  amount!: number;

  @IsBoolean()
  isRoundFinished?: boolean;

  @IsOptional()
  @IsObject()
  sessionState?: any;

  @IsString()
  relatedExternalDebitTransactionId!: string;

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

export class RollbackRequestDto {
  @IsString()
  playerId!: string;

  @IsString()
  transactionId!: string;

  @IsString()
  gameId!: string;

  @IsOptional()
  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsNumber()
  debitAmount?: number;

  @IsOptional()
  @IsNumber()
  creditAmount?: number;

  @IsString()
  currency?: string;

  @IsString()
  roundId?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  relatedExternalDebitTransactionId?: string;

  @IsOptional()
  @IsObject()
  sessionState?: any;

  @IsOptional()
  @IsString()
  transactionProviderPrefix?: string;

  @IsOptional()
  @IsObject()
  additionalData?: any;

  @IsNumber()
  date?: number;

  @IsString()
  sign?: string;
}

export class DebitAndCreditDto {
  @IsString()
  playerId!: string;

  @IsString()
  transactionId!: string;

  @IsString()
  gameId!: string;

  @IsOptional()
  @IsNumber()
  debitAmount?: number;

  @IsOptional()
  @IsNumber()
  creditAmount?: number;

  @IsString()
  currency?: string;

  @IsString()
  roundId?: string;

  @IsOptional()
  @IsObject()
  sessionState?: any;

  @IsNumber()
  channel?: number;

  @IsNumber()
  date?: number;

  @IsString()
  sign?: string;
}
