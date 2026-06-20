import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

export enum BonusType {
  WELCOME = 'welcome',
  NO_DEPOSIT = 'no_deposit',
  FREE_SPINS = 'free_spins',
  RELOAD = 'reload',
  CASHBACK = 'cashback',
  HIGH_ROLLER = 'high_roller',
  VIP_LOYALTY = 'vip_loyalty',
  TOURNAMENT = 'tournament',
  BIRTHDAY = 'birthday',
  REFER_FRIEND = 'refer_friend',
  NO_WAGER = 'no_wager',
}

export enum BonusRewardType {
  CASH = 'cash',
  FREE_SPINS = 'free_spins',
  BOTH = 'both',
}

export enum BonusStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  PAUSED = 'paused',
  SCHEDULED = 'scheduled',
}

@Entity('promotions')
export class PromotionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
}
