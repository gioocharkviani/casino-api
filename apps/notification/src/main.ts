import { NestFactory } from '@nestjs/core';
import { NotificationMsModule } from './notification.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationMsModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.MS_LISTEN_HOST || '0.0.0.0',
        port: 3037,
      },
    },
  );
  console.log('NOTIFICATION MSS START SUCCESSFULLY');
  await app.listen();
}
bootstrap();
