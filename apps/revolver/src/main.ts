import { NestFactory } from '@nestjs/core';
import { RevolverModule } from './revolver.module';

async function bootstrap() {
  const app = await NestFactory.create(RevolverModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
