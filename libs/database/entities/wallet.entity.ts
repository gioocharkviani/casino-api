import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('wallet')
export class walletEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ nullable: false, default: 0 })
  balance!: number;
  @Column()
  currency?: string;
  @OneToOne(() => UserEntity, (user) => user.wallet)
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}

@Entity('bonus-wallet')
export class bonusWallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
}
