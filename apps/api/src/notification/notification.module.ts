import { Module } from '@nestjs/common';
import { notificationController } from './notification.controller';
import { notificationService } from './notification.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmailService } from 'apps/notification/src/email/email.service';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_MS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.TCP,
          options: { host: cfg.get('NOTIFICATION_MS_HOST', 'localhost'), port: 3037 },
        }),
      },
    ]),
  ],
  controllers: [notificationController],
  providers: [notificationService, EmailService],
  exports: [notificationService, EmailService],
})
export class NotificationModule {}
