import { NestFactory } from '@nestjs/core';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UserModule } from './user.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3035,
      },
    },
  );
  console.log('AUTH MODULE START SUCCESSFULLY');
  await app.listen();
}
bootstrap();
