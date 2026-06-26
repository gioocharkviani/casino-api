import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  PromotionType,
  RewardType,
  PromotionStatus,
} from 'libs/database/entities/promotions.entity';

class RewardValueDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  percentage?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  fixedAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  freeSpins?: number;
}

class TargetAudienceDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countries?: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  vipLevels?: number[];

  @IsOptional()
  @IsInt()
  @Min(0)
  minDepositCount?: number;
}

class TriggerConditionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  minDeposit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lossThreshold?: number;

  @IsOptional()
  @IsString()
  promoCode?: string;

  // deposit | registration | birthday
  @IsOptional()
  @IsString()
  eventType?: string;
}

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PromotionType)
  type!: PromotionType;

  @IsEnum(RewardType)
  rewardType!: RewardType;

  @IsObject()
  @ValidateNested()
  @Type(() => RewardValueDto)
  rewardValue!: RewardValueDto;

  @IsInt()
  @Min(0)
  @Max(100)
  wageringMultiplier!: number;

  @IsOptional()
  @IsObject()
  gameWeights?: Record<string, number>;

  @IsOptional()
  @ValidateNested()
  @Type(() => TriggerConditionDto)
  triggerCondition?: TriggerConditionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TargetAudienceDto)
  targetAudience?: TargetAudienceDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxWithdrawal?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsagePerUser?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  validityHours?: number;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsString()
  performedBy?: string;
}

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;
}

export class AssignPromotionDto {
  @IsUUID()
  promotionId!: string;

  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  overrideAmount?: number;

  @IsOptional()
  @IsString()
  performedBy?: string;
}

export class ActivateBonusDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  userPromotionId!: string;
}

export class RedeemPromoCodeDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class BetSettledEventDto {
  @IsUUID()
  userId!: string;

  @IsInt()
  @Min(0)
  betAmount!: number;

  @IsOptional()
  @IsString()
  gameKey?: string;
}

export class PromoTriggerEventDto {
  @IsUUID()
  userId!: string;

  // deposit | registration | birthday
  @IsString()
  eventType!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;
}

// legacy event types kept for backward compatibility
export enum eventTypes {
  DEPOSIT = 'deposit_event',
  WITHDRAWAL = 'withdrawal_event',
  BIRTHDAY = 'birthday_event',
  CREDIT_DEBIT = 'creditOrDebit_event',
}

export class promotionEventListenerDto {
  @IsOptional()
  type?: eventTypes;
}
