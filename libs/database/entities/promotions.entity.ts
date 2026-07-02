import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

export enum PromotionType {
  WELCOME = 'welcome',
  NO_DEPOSIT = 'no_deposit',
  FREE_SPINS = 'free_spins',
  RELOAD = 'reload',
  CASHBACK = 'cashback',
  HIGH_ROLLER = 'high_roller',
  LOYALTY = 'loyalty',
  TOURNAMENT = 'tournament',
  BIRTHDAY = 'birthday',
  REFERRAL = 'referral',
  NO_WAGER = 'no_wager',
}

export enum RewardType {
  BONUS_BALANCE = 'bonus_balance',
  REAL_BALANCE = 'real_balance',
  FREE_SPINS = 'free_spins',
}

export enum PromotionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum UserPromotionStatus {
  ASSIGNED = 'assigned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum PromotionAuditAction {
  CREATED = 'created',
  UPDATED = 'updated',
  ASSIGNED = 'assigned',
  ACTIVATED = 'activated',
  CREDITED = 'credited',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('promotions')
@Index('idx_promo_status_type', ['status', 'type'])
export class PromotionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: PromotionType })
  type!: PromotionType;

  @Column({
    type: 'enum',
    enum: PromotionStatus,
    default: PromotionStatus.DRAFT,
  })
  status!: PromotionStatus;

  @Column({ type: 'enum', enum: RewardType })
  rewardType!: RewardType;

  // { percentage?, fixedAmount?, maxAmount?, freeSpins? }
  @Column({ type: 'json', nullable: true })
  rewardValue!: Record<string, any>;

  // 0 = wager-free, >0 = playthrough multiplier
  @Column({ type: 'int', default: 0 })
  wageringMultiplier!: number;

  // per-game contribution weights, e.g. { slots: 100, roulette: 10 }
  @Column({ type: 'json', nullable: true })
  gameWeights!: Record<string, number>;

  // { minDeposit?, lossThreshold?, promoCode? }
  @Column({ type: 'json', nullable: true })
  triggerCondition?: Record<string, any>;

  // { countries?, vipLevels?, minDepositCount? }
  @Column({ type: 'json', nullable: true })
  targetAudience?: Record<string, any>;

  // cap on withdrawable winnings from this bonus (minor units)
  @Column({ type: 'bigint', nullable: true })
  maxWithdrawal?: number;

  @Column({ type: 'int', default: 1 })
  maxUsagePerUser!: number;

  // hours after activation user has to complete wagering
  @Column({ type: 'int', default: 72 })
  validityHours!: number;

  // For FREE_SPINS promotions: Revolver game UUIDs admin pre-selected
  @Column({ type: 'json', nullable: true })
  freeSpinsGameIds?: string[];

  // Bet amount per free spin in minor units (e.g. 100 = 1.00)
  @Column({ type: 'int', nullable: true })
  freeSpinsBetAmount?: number;

  // If true: user picks which eligible game to play (Revolver API fires at activation time)
  @Column({ type: 'boolean', default: false })
  userChoosesGame!: boolean;

  // When userChoosesGame=true, restrict which category games are eligible (e.g. ['slots'])
  @Column({ type: 'json', nullable: true })
  eligibleCategories?: string[];

  // Game restriction: if set, bonus wagering only counts on these specific game UUIDs
  // Casino frontend must also enforce this by only showing these games during active bonus
  @Column({ type: 'json', nullable: true })
  allowedGameUUIDs?: string[];

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('user_promotions')
@Index('idx_user_promo_user_status', ['userId', 'status'])
@Index('idx_user_promo_pair', ['userId', 'promotionId'])
export class UserPromotionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column({ type: 'varchar', length: 36 })
  promotionId!: string;

  @ManyToOne(() => PromotionEntity, { eager: true })
  @JoinColumn({ name: 'promotionId' })
  promotion!: PromotionEntity;

  @Column({
    type: 'enum',
    enum: UserPromotionStatus,
    default: UserPromotionStatus.ASSIGNED,
  })
  status!: UserPromotionStatus;

  // isolated bonus funds (minor units)
  @Column({ type: 'bigint', default: 0 })
  bonusBalance!: number;

  @Column({ type: 'bigint', default: 0 })
  wageringRequired!: number;

  @Column({ type: 'bigint', default: 0 })
  wageringCompleted!: number;

  @Column({ type: 'timestamp', nullable: true })
  activatedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('promotion_audit_log')
@Index('idx_audit_promo', ['promotionId'])
@Index('idx_audit_user', ['userId'])
export class PromotionAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: PromotionAuditAction })
  action!: PromotionAuditAction;

  @Column({ type: 'varchar', length: 36, nullable: true })
  promotionId?: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  userId?: string;

  @Column({ type: 'varchar', nullable: true })
  performedBy?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;
}
