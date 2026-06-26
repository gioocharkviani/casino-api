import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AdminEntity, AdminSessionEntity } from 'libs/database/entities/admin.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from 'libs/guards/admin.guard';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AdminEntity, AdminSessionEntity]),
    ClientsModule.register([
      {
        name: 'PROMO_MS_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3038 },
      },
      {
        name: 'USER_MS_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3035 },
      },
      {
        name: 'GAME_MS_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3039 },
      },
      {
        name: 'WALLET_MS_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3031 },
      },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminGuard],
})
export class AdminModule {}
