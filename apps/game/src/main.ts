import { NestFactory } from '@nestjs/core';
import { GameModule } from './game.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    GameModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3030,
      },
    },
  );
  console.log('GAME MODULE START SUCCESSFULLY');
  await app.listen();
}
bootstrap();
