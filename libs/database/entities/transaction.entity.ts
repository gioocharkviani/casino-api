import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

enum TransactionType {
  BET = 'bet',
  WIN = 'win',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  BONUS = 'bonus',
  ROLLBACK = 'rollback',
  ADJUSTMENT = 'adjustment',
}

@Entity('transactions')
@Index('idx_user_created', ['userId', 'createdAt'])
@Index('idx_transaction_id', ['transactionId'], { unique: true })
@Index('idx_round_id', ['roundId'])
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.BET,
  })
  type!: TransactionType;

  @Column({ type: 'bigint' })
  amount?: number;
  @Column({ type: 'bigint', name: 'balance_before' })
  balanceBefore!: number;

  @Column({ type: 'bigint', name: 'balance_after' })
  balanceAfter?: number;

  @Column({ type: 'varchar', nullable: true, name: 'game_id' })
  gameId?: string;

  @Column({ type: 'varchar', nullable: true, name: 'round_id' })
  roundId?: string;

  @Column({ type: 'varchar', name: 'reason' })
  reason?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
    name: 'transaction_id',
  })
  transactionId?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'game_session_id',
  })
  gameSessionId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
