import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'libs/database/database.module';
import { WalletModule } from './wallet/wallet.module';
import { NotificationModule } from './notification/notification.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { PromotionsGatewayModule } from './promotions/promotions.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    NotificationModule,
    GameModule,
    DatabaseModule,
    WalletModule,
    UserModule,
    AdminModule,
    PromotionsGatewayModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
