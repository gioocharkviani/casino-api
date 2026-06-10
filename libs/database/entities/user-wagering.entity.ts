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

  // ფულადი ველები - BIGINT (მთელი რიცხვები, ვალუტის მიხედვით)
  @Column({ type: 'bigint', default: 0 })
  totalDeposits!: number;

  @Column({ type: 'bigint', default: 0 })
  totalWithdrawals!: number;

  @Column({ type: 'bigint', default: 0 })
  totalDebit!: number;

  @Column({ type: 'bigint', default: 0 })
  totalCredit!: number;

  @Column({ type: 'bigint', default: 0 })
  totalWagered!: number;

  @Column({ type: 'bigint', default: 0 })
  netProfit!: number;

  // RTP - პროცენტი (2 ათწილადი საკმარისია)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  rtp!: number;

  // ბონუსები
  @Column({ default: 0 })
  bonusBetsCount!: number;

  @Column({ type: 'bigint', default: 0 })
  bonusWinnings!: number;

  // პერიოდული ველები - BIGINT
  @Column({ type: 'bigint', default: 0 })
  todayWagered!: number;

  @Column({ type: 'bigint', default: 0 })
  weeklyWagered!: number;

  @Column({ type: 'bigint', default: 0 })
  monthlyWagered!: number;

  // დროის ველები
  @Column({ type: 'timestamp', nullable: true })
  lastActivityDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastResetDate?: Date;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
