import { NestFactory } from '@nestjs/core';
import { GameModule } from './game.module';

async function bootstrap() {
  const app = await NestFactory.create(GameModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
