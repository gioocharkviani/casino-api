import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('country')
export class CountryEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  countryName!: string;
  @Column()
  countryCode!: string;
  @Column()
  countryLicense!: string;

  @OneToMany(() => UserEntity, (user) => user.country)
  users!: UserEntity[];
}
