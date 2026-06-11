import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import {
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

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
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
      ],

      synchronize: false,

      timezone: '+04:00',
      charset: 'utf8mb4',
      extra: {
        connectionLimit: 10,
      },
    }),
    TypeOrmModule.forFeature([
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
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
