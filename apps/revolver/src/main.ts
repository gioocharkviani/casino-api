import { NestFactory } from '@nestjs/core';
import { RevolverModule } from './revolver.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    RevolverModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3030,
      },
    },
  );
  console.log('database service start successfully');
  await app.listen();
}
bootstrap();
