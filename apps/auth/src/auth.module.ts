import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseModule } from 'libs/database/database.module';
import { ConfigModule } from '@nestjs/config';

import { NotificationMsModule } from 'apps/notification/src/notification.module';

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot(), NotificationMsModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
