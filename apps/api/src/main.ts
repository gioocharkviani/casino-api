import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { swaggerDocument } from './swagger.document';
import { setGlobalDispatcher, Agent } from 'undici';

import cookieParser from 'cookie-parser';

async function bootstrap() {
  setGlobalDispatcher(
    new Agent({
      connect: {
        family: 4,
      },
    }),
  );

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  SwaggerModule.setup('swagger', app, swaggerDocument as any, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  console.log('API MODULE START SUCCESSFULLY');
  await app.listen(3000);
}
bootstrap();
