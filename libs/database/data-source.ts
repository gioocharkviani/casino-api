import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import {
  CategoryDefinition,
  FavoriteGame,
  Game,
  GameCategories,
  GameProvider,
  GameSession,
  MetaData,
} from './entities/game.entity';
import { bonusWallet, walletEntity } from './entities/wallet.entity';
import {
  UserEntity,
  UserLevelsEntity,
  UserSessionEntity,
  userVerificationEntity,
} from './entities/user.entity';
import { CountryEntity } from './entities/country.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { UserWageringStats } from './entities/user-wagering.entity';
import {
  PromotionEntity,
  UserPromotionEntity,
  PromotionAuditEntity,
} from './entities/promotions.entity';
import { AdminEntity, AdminSessionEntity } from './entities/admin.entity';

config();

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  // 👇 მკაფიო თანმიმდევრობა - ჯერ Parent, შემდეგ Child
  entities: [
    Game,
    MetaData,
    GameProvider,
    walletEntity,
    UserEntity,
    CountryEntity,
    TransactionEntity,
    GameSession,
    UserSessionEntity,
    userVerificationEntity,
    GameCategories,
    UserWageringStats,
    bonusWallet,
    UserLevelsEntity,
    FavoriteGame,
    PromotionEntity,
    UserPromotionEntity,
    PromotionAuditEntity,
    AdminEntity,
    AdminSessionEntity,
    CategoryDefinition,
  ],

  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],

  synchronize: false,
  logging: true,
  timezone: '+04:00',
  charset: 'utf8mb4',
});
