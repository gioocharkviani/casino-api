import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('promotions')
export class PromotionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column()
  name?: string;
  @Column({ type: 'boolean', default: true })
  isActive?: boolean;
}
