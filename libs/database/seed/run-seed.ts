import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const appContext = await NestFactory.create(SeedModule);
  const seeder = appContext.get(SeedService);

  try {
    await seeder.run();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await appContext.close();
  }
}

bootstrap();
