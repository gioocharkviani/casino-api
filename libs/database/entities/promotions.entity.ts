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
@Index(['type', 'status'])
@Index(['startDate', 'endDate'])
export class PromotionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'enum', enum: BonusType })
  type!: BonusType;

  @Column({ type: 'enum', enum: BonusStatus, default: BonusStatus.ACTIVE })
  status!: BonusStatus;

  @Column({
    type: 'enum',
    enum: BonusRewardType,
    default: BonusRewardType.CASH,
  })
  rewardType!: BonusRewardType;

  // --- Cash Bonus Settings ---
  @Column({ type: 'json', nullable: true })
  cashBonusConfig!: {
    matchPercent: number; // 100 = 100%
    maxBonusAmount: number; // in cents
    minDeposit: number; // in cents
    maxDeposit: number; // in cents
    isWageringRequired: boolean;
    wageringMultiplier: number; // 35 = 35x
    wageringType: 'bonus_only' | 'deposit_and_bonus';
    releaseType: 'instant' | 'gradual'; // gradual = releases in chunks
    releaseAmount?: number; // per release chunk
    releaseInterval?: number; // in hours
  };

  // --- Free Spins Settings ---
  @Column({ type: 'json', nullable: true })
  freeSpinsConfig!: {
    spinsCount: number;
    slotIds: string[]; // specific slots or empty = all
    spinValue: number; // value per spin in cents
    isWageringRequired: boolean;
    wageringMultiplier: number; // if wagering required
    maxWin: number; // max win from free spins
    releaseType: 'instant' | 'daily' | 'over_time';
    releaseDays?: number; // if over_time, how many days
    dailySpins?: number; // if daily, spins per day
  };

  // --- General Settings ---
  @Column({ type: 'json', nullable: true })
  eligibilityConfig!: {
    minUserLevel: number;
    maxUserLevel: number;
    eligibleCountries: string[];
    excludedCountries: string[];
    requiredVerification: boolean;
    firstDepositOnly: boolean;
    maxUsagePerUser: number;
    totalUsageLimit: number;
    cooldownDays: number; // days between claims
  };

  // --- Time Settings ---
  @Column({ type: 'json', nullable: true })
  timeConfig!: {
    startDate: Date;
    endDate: Date;
    availableDays: string[];
    availableTimeStart: string;
    availableTimeEnd: string;
    timezone: string;
  };

  // --- Display Settings ---
  @Column({ type: 'json', nullable: true })
  displayConfig!: {
    imageUrl: string;
    bannerUrl: string;
    displayOrder: number;
    isVisible: boolean;
    highlightColor: string;
    termsUrl: string;
  };

  // --- Auto-Apply Rules ---
  @Column({ type: 'json', nullable: true })
  autoApplyConfig!: {
    enabled: boolean;
    triggerEvent:
      | 'first_deposit'
      | 'every_deposit'
      | 'deposit_amount'
      | 'deposit_count';
    triggerValue?: number; // e.g., deposit amount or count
    applyOnce: boolean;
  };

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // @OneToMany(() => UserPromotionEntity, (up) => up.promotion)
  // userPromotions!: UserPromotionEntity[];
}
