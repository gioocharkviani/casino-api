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
import { Game } from './game.entity';
import {
  TransactionStatusEnum,
  TransactionType,
} from '../../common/enums/transactionTypes.enum';

@Entity('transactions')
@Index('idx_user_created', ['userId', 'createdAt'])
@Index('idx_transaction_id', ['transactionId'], { unique: true })
@Index('idx_round_id', ['roundId'])
@Index('idx_game_id', ['gameId'])
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
    nullable: true,
  })
  type?: TransactionType;

  @Column({ type: 'bigint', nullable: true })
  amount?: number;

  @Column({ type: 'enum', enum: TransactionStatusEnum, nullable: true })
  status?: TransactionStatusEnum;

  @Column({ type: 'varchar', nullable: true })
  paymentId?: string;

  @Column({ type: 'bigint', name: 'balance_before' })
  balanceBefore!: number;

  @Column({ type: 'bigint', name: 'balance_after' })
  balanceAfter?: number;

  // Game ID - VARCHAR (რადგან GAP-დან მოდის UUID ან სხვა სტრინგი)
  @Column({ type: 'varchar', nullable: true, name: 'game_id' })
  gameId?: string;

  // Game relationship - OPTIONAL, თუ გინდათ Game-ის დეტალების ამოღება
  @ManyToOne(() => Game, { nullable: true })
  @JoinColumn({ name: 'game_id', referencedColumnName: 'gameUUID' }) // დააკავშირეთ gameUUID-თან
  game!: Game | null;

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
    nullable: true,
    name: 'game_session_id',
  })
  gameSessionId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
