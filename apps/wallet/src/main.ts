import { NestFactory } from '@nestjs/core';
import { WalletModule } from './wallet.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(WalletModule);

  app.enableCors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'Cookie',
      'X-API-Key',
      'X-Merchant-Id',
      'X-Idempotency-Key',
      'User-Agent',
    ],
    exposedHeaders: ['Set-Cookie'],
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3031,
    },
  });

  await app.startAllMicroservices();
  console.log('WALLET MODULE START SUCCESSFULLY');
  await app.listen(3000);
}
bootstrap();
