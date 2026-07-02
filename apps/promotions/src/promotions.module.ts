import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from 'libs/database/database.module';
import {
  PromotionEntity,
  UserPromotionEntity,
  PromotionAuditEntity,
} from 'libs/database/entities/promotions.entity';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { WageringProgressService } from './wagering-progress.service';
import { BonusExpiryScheduler } from './bonus-expiry.scheduler';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    TypeOrmModule.forFeature([
      PromotionEntity,
      UserPromotionEntity,
      PromotionAuditEntity,
    ]),
    ClientsModule.registerAsync([
      {
        name: 'WALLET_MS_SERVICE',
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: cfg.get('WALLET_MS_HOST') ?? 'localhost',
            port: Number(cfg.get('WALLET_MS_PORT') ?? 3031),
          },
        }),
      },
      {
        name: 'GAME_MS_SERVICE',
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: cfg.get('GAME_MS_HOST') ?? 'localhost',
            port: Number(cfg.get('GAME_MS_PORT') ?? 3039),
          },
        }),
      },
    ]),
  ],
  controllers: [PromotionsController],
  providers: [PromotionsService, WageringProgressService, BonusExpiryScheduler],
})
export class PromotionsModule {}
