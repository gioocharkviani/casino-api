import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'libs/database/database.module';
import { WalletModule } from './wallet/wallet.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from 'apps/auth/src/auth.service';

import { NotificationModule } from './notification/notification.module';
import { notificationService } from './notification/notification.service';
import { NotificationService } from 'apps/notification/src/notification.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    NotificationModule,
    GameModule,
    DatabaseModule,
    WalletModule,
    AuthModule,
  ],
  controllers: [],
  providers: [AuthService, NotificationService],
  exports: [AuthService, NotificationService],
})
export class AppModule {}
