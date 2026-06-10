import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('user_wagering_stats')
@Index(['userId'])
export class UserWageringStats {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalDeposits!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalWithdrawals!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalDebit!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCredit!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalWagered!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  netProfit!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  rtp!: number;

  @Column({ default: 0 })
  bonusBetsCount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  bonusWinnings!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  todayWagered!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  weeklyWagered!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlyWagered!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityDate!: Date;

  @Column({ type: 'date', nullable: true })
  lastResetDate!: Date;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
