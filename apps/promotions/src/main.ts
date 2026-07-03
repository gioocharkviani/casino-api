import { NestFactory } from '@nestjs/core';
import { PromotionsModule } from './promotions.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { setGlobalDispatcher, Agent } from 'undici';

async function bootstrap() {
  setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PromotionsModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.MS_LISTEN_HOST || '0.0.0.0',
        port: 3038,
      },
    },
  );
  console.log('PROMOTION MSS START SUCCESSFULLY');
  await app.listen();
}
bootstrap();
