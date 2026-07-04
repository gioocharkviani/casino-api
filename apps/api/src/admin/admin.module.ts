import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AdminEntity, AdminSessionEntity } from 'libs/database/entities/admin.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from 'libs/guards/admin.guard';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AdminEntity, AdminSessionEntity]),
    ClientsModule.registerAsync([
      {
        name: 'PROMO_MS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.TCP,
          options: { host: cfg.get('PROMOTIONS_MS_HOST', 'localhost'), port: 3038, retryAttempts: 10, retryDelay: 3000 },
        }),
      },
      {
        name: 'USER_MS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.TCP,
          options: { host: cfg.get('USER_MS_HOST', 'localhost'), port: 3035, retryAttempts: 10, retryDelay: 3000 },
        }),
      },
      {
        name: 'GAME_MS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.TCP,
          options: { host: cfg.get('GAME_MS_HOST', 'localhost'), port: 3039, retryAttempts: 10, retryDelay: 3000 },
        }),
      },
      {
        name: 'WALLET_MS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.TCP,
          options: { host: cfg.get('WALLET_MS_HOST', 'localhost'), port: 3031, retryAttempts: 10, retryDelay: 3000 },
        }),
      },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminGuard],
})
export class AdminModule {}
