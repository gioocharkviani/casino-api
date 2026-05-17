import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'libs/database/database.module';
import { WalletModule } from './wallet/wallet.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    GameModule,
    DatabaseModule,
    WalletModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
