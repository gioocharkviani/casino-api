import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Game, GameProvider, MetaData } from './entities/game.entity';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [Game, MetaData, GameProvider],
      synchronize: true,
      timezone: '+04:00',
      charset: 'utf8mb4',
      extra: {
        connectionLimit: 10,
      },
    }),
    TypeOrmModule.forFeature([Game, MetaData, GameProvider]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
