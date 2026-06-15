import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

// ===========================
// ENUMS
// ===========================
export enum PromoType {
  WELCOME = 'welcome',
  NO_DEPOSIT = 'nodeposit',
  FREE_SPINS = 'freespins',
  RELOAD = 'reload',
  CASHBACK = 'cashback',
  HIGH_ROLLER = 'highroller',
  LOYALTY = 'loyalty',
  TOURNAMENT = 'tournament',
  BIRTHDAY = 'birthday',
  REFERRAL = 'referral',
  NO_WAGER = 'nowager',
  DRIP = 'drip',
  RELOCATION = 'relocation',
  ACHIEVEMENT = 'achievement',
}

export enum PromotionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  ARCHIVED = 'archived',
}

// ===========================
// EXPORT
// ===========================
export const entities = [];
