import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { RevolverService } from './revolver/revolver.service';
import { RevolverController } from './revolver/revolver.controller';
import { DatabaseModule } from 'libs/database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot()],
  controllers: [GameController, RevolverController],
  providers: [GameService, RevolverService],
  exports: [GameService, RevolverService],
})
export class GameModule {}
