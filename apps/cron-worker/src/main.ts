import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CronWorkerModule } from './cron-worker.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CronWorkerModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.MS_LISTEN_HOST || '0.0.0.0',
        port: 3030,
      },
    },
  );
  console.log('CRON-WORKER MODULE START SUCCESSFULLY');
  await app.listen();
}
bootstrap();
