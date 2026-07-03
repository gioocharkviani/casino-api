import { NestFactory } from '@nestjs/core';
import { NotificationMsModule } from './notification.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { setGlobalDispatcher, Agent } from 'undici';

async function bootstrap() {
  setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

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
