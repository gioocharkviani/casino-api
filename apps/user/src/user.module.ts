import { Module } from '@nestjs/common';

import { DatabaseModule } from 'libs/database/database.module';
import { ConfigModule } from '@nestjs/config';

import { NotificationMsModule } from 'apps/notification/src/notification.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot(), NotificationMsModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
