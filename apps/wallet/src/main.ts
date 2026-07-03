import { NestFactory } from '@nestjs/core';
import { WalletModule } from './wallet.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { setGlobalDispatcher, Agent } from 'undici';

async function bootstrap() {
  setGlobalDispatcher(
    new Agent({
      connect: {
        family: 4,
      },
    }),
  );

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    WalletModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.MS_LISTEN_HOST || '0.0.0.0',
        port: 3031,
      },
    },
  );
  console.log('WALLET MODULE START SUCCESSFULLY');
  await app.listen();
}
bootstrap();
