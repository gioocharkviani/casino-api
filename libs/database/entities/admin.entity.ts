import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

@Entity('admins')
export class AdminEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  @Column({ type: 'enum', enum: AdminRole, default: AdminRole.MODERATOR })
  role!: AdminRole;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('admin_sessions')
export class AdminSessionEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', unique: true, nullable: true, default: null })
  token?: string;

  @Column({ nullable: true, default: null })
  ip?: string;

  @Column()
  adminId!: string;

  // denormalised for fast guard checks without a join
  @Column({ type: 'enum', enum: AdminRole, default: AdminRole.MODERATOR })
  adminRole!: AdminRole;

  @CreateDateColumn()
  createdAt?: Date;

  @Column()
  expiresAt!: Date;
}
