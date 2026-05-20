import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CountryEntity } from './country.entity';

@Entity('user')
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

  @ManyToOne(() => CountryEntity, (country) => country.users, {
    nullable: true,
    eager: false,
  })
  @JoinColumn({ name: 'country' })
  country!: CountryEntity;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  citizenship?: string;

  @Column({ type: 'date' })
  birthday!: Date;

  @Column({ nullable: true, default: false, type: 'boolean' })
  verified?: boolean;

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
