import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { RevolverService } from './revolver/revolver.service';
import { RevolverController } from './revolver/revolver.controller';
import { NuxgameService } from './nuxgame/nuxgame.service';
import { NuxgameController } from './nuxgame/nuxgame.controller';
import { DatabaseModule } from 'libs/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from 'apps/user/src/user.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [DatabaseModule, UserModule, ConfigModule.forRoot()],
  controllers: [GameController, RevolverController, NuxgameController],
  providers: [GameService, RevolverService, NuxgameService],
  exports: [GameService, RevolverService, NuxgameService],
})
export class GameModule {}
