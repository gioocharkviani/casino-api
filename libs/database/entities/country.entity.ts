import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('country')
export class CountryEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ nullable: true })
  name?: string;
  @Column({ nullable: true })
  countryCode?: string;
  @Column({ nullable: true })
  license?: string;
  @CreateDateColumn()
  createdAt?: Date;
  @OneToMany(() => UserEntity, (user) => user.country)
  users!: UserEntity[];
}
