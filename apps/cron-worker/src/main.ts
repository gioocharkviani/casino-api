import { NestFactory } from '@nestjs/core';
CronWorkerModule;
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CronWorkerModule } from './cron-worker.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CronWorkerModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3030,
      },
    },
  );
  console.log('CRON-WORKER MODULE START SUCCESSFULLY');
  await app.listen();
}
bootstrap();
