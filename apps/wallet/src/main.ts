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

  // DEBUG: შემოწმება, ნამდვილად IPv4-ით გადის თუ არა fetch
  try {
    const res = await fetch('https://api64.ipify.org?format=json');
    const data = await res.json();
    console.log('🔍 DEBUG Outbound IP:', data.ip);
  } catch (err) {
    console.error('🔍 DEBUG IP check failed:', err);
  }

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
