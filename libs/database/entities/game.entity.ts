import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';

@Entity('game_providers')
export class GameProvider {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 100 })
  name?: string;

  @Column({ unique: true, length: 10 })
  prefix?: string;

  @Column({ nullable: true })
  logo?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @OneToMany(() => Game, (game) => game.gameProvider)
  games?: Game[];
}

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ unique: true })
  gameUUID?: string;

  @Column({ unique: true })
  gameHumanReadableId?: string;

  @Column()
  gameName?: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'text', nullable: true })
  rules?: string | null;

  @Column({ default: 1 })
  status?: boolean;

  @OneToOne(() => MetaData, (metaData) => metaData.game, {
    cascade: true,
    eager: false,
    nullable: true,
  })
  @JoinColumn()
  metaData?: MetaData | null;

  @Column({ name: 'provider_id' })
  providerId!: number;

  @ManyToOne(() => GameProvider, (provider) => provider.games, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'provider_id' })
  gameProvider?: GameProvider;

  @Column()
  thumbnail?: string;

  @Column()
  marketingMaterialsZip?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//game meta_data
@Entity('game_meta_data')
export class MetaData {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ nullable: true })
  reelsWidth?: number;

  @Column({ nullable: true })
  reelsHeight?: number;

  @Column({ nullable: true })
  lines?: number;

  @Column({ nullable: true })
  marketing_materials?: string;

  @Column({ nullable: true })
  supports_promo_freespins?: boolean;

  @OneToOne(() => Game, (game: Game) => game.metaData)
  game?: Game;
}
