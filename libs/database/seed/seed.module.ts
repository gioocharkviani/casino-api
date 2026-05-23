import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { CountryEntity } from '../entities/country.entity';
import { DatabaseModule } from '../database.module';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([CountryEntity])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
