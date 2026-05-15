import { Module } from '@nestjs/common';
import { RevolverController } from './revolver.controller';
import { RevolverService } from './revolver.service';
import { DatabaseModule } from 'libs/database/database.module';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Game } from 'libs/database/entities/game.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [RevolverController],
  providers: [RevolverService],
})
export class RevolverModule {}
