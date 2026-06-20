import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  Min,
} from 'class-validator';
import { TransactionStatusEnum, TransactionType } from 'libs/common';

// CREATE TRANSACTION DTO
export class CreateTransactionDto {
  @IsUUID()
  userId?: string;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  balanceBefore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  balanceAfter?: number;

  @IsOptional()
  @IsString()
  gameId?: string;

  @IsOptional()
  @IsString()
  roundId?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsNumber()
  gameSessionId?: number;

  @IsOptional()
  @IsEnum({ enum: TransactionStatusEnum })
  status?: TransactionStatusEnum;

  @IsOptional()
  @IsString()
  paymentId?: string;
}
