import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'libs/database/database.module';
import { WalletModule } from './wallet/wallet.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from 'apps/auth/src/auth.service';
import { AuthService as ggg } from './auth/auth.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    GameModule,
    DatabaseModule,
    WalletModule,
    AuthModule,
  ],
  controllers: [],
  providers: [AuthService],
  exports: [AuthService],
})
export class AppModule {}
