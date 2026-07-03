import { NestFactory } from '@nestjs/core';
import { WalletModule } from './wallet.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import dns from 'node:dns';

async function bootstrap() {
  // აიძულებს Node-ს DNS რეზოლუციისას IPv4 მისამართები
  // პირველად დააბრუნოს, IPv6-ის ნაცვლად — მოქმედებს native fetch()-ზეც
  dns.setDefaultResultOrder('ipv4first');

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
