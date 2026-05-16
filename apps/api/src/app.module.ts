import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'libs/database/database.module';

@Module({
  imports: [ConfigModule.forRoot(), GameModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
