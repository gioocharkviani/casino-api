import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'libs/database/database.module';
import { WalletModule } from './wallet/wallet.module';

import { NotificationModule } from './notification/notification.module';
import { NotificationService } from 'apps/notification/src/notification.service';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    NotificationModule,
    GameModule,
    DatabaseModule,
    WalletModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
