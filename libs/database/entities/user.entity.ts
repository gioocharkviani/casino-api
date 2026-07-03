import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToOne,
} from 'typeorm';
import { CountryEntity } from './country.entity';
import { walletEntity } from './wallet.entity';

@Entity('user')
@Index('idx_user', ['id'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  userName!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @ManyToOne(() => CountryEntity, (country) => country.users)
  @JoinColumn({ name: 'countryId' })
  country!: CountryEntity;

  @Column({ nullable: true })
  countryId!: number;

  @OneToOne(() => walletEntity, (wallet) => wallet.user, {
    cascade: ['insert', 'update'],
    nullable: true,
  })
  wallet?: walletEntity;

  @Column({ type: 'int', default: 0 })
  xp?: number;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  citizenship?: string;

  @Column({ type: 'date' })
  birthday!: Date;

  @Column({ nullable: true, default: false, type: 'boolean' })
  verified?: boolean;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  personalId?: string;

  @Column({ default: false, type: 'boolean' })
  isBlocked!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  blockReason?: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  resetToken?: string | null;

  @Column({ type: 'datetime', nullable: true })
  resetTokenExpiresAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('user_session')
export class UserSessionEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', unique: true, nullable: true, default: null })
  token!: string | null;

  @Column({ nullable: true, default: null })
  ip?: string;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt?: Date;

  @Column()
  expiresAt!: Date;
}

@Entity('user-verify')
export class userVerificationEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'varchar', nullable: true })
  userId?: string;
  @Column({ type: 'varchar', nullable: true })
  otp?: string;
  @CreateDateColumn()
  createdAt?: Date;
  @Column({ type: 'datetime' })
  expiresAt!: Date;
}

@Entity('user-levels')
export class UserLevelsEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'int' })
  minPoints!: number;

  @Column({ type: 'int' })
  maxPoints!: number;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  badgeUrl?: string; // ლეველის ბეჯის სურათი

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn()
  updatedAt!: Date;
}
