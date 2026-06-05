import { Module } from '@nestjs/common';
import { notificationController } from './notification.controller';
import { notificationService } from './notification.service';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmailService } from 'apps/notification/src/email/email.service';
import { NotificationMsModule } from 'apps/notification/src/notification.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: `NOTIFICATION_MS_SERVICE`,
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3037 },
      },
    ]),
    ConfigModule,
  ],
  controllers: [notificationController],
  providers: [notificationService, EmailService],
  exports: [notificationService, EmailService],
})
export class NotificationModule {}
