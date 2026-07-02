import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CronWorkerController } from './cron-worker.controller';
import { CronWorkerService } from './cron-worker.service';
import { AdminEntity, AdminSessionEntity } from 'libs/database/entities/admin.entity';
import { UserEntity, UserSessionEntity, userVerificationEntity } from 'libs/database/entities/user.entity';
import { GameProvider, Game, GameCategories, MetaData, GameSession, FavoriteGame } from 'libs/database/entities/game.entity';
import { PromotionEntity, UserPromotionEntity, PromotionAuditEntity } from 'libs/database/entities/promotions.entity';
import { TransactionEntity } from 'libs/database/entities/transaction.entity';
import { UserWageringStats } from 'libs/database/entities/user-wagering.entity';
import { CountryEntity } from 'libs/database/entities/country.entity';
import { walletEntity } from 'libs/database/entities/wallet.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host:     config.get<string>('DB_HOST',     '127.0.0.1'),
        port:     config.get<number>('DB_PORT',     3333),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', 'casino'),
        entities: [
          AdminEntity,
          AdminSessionEntity,
          UserEntity,
          UserSessionEntity,
          userVerificationEntity,
          CountryEntity,
          walletEntity,
          GameProvider,
          Game,
          GameCategories,
          MetaData,
          GameSession,
          FavoriteGame,
          PromotionEntity,
          UserPromotionEntity,
          PromotionAuditEntity,
          TransactionEntity,
          UserWageringStats,
        ],
        synchronize: false,
        timezone: '+04:00',
        charset: 'utf8mb4',
      }),
    }),
    TypeOrmModule.forFeature([
      AdminSessionEntity,
      UserSessionEntity,
      userVerificationEntity,
      GameSession,
      UserPromotionEntity,
    ]),
  ],
  controllers: [CronWorkerController],
  providers: [CronWorkerService],
})
export class CronWorkerModule {}
