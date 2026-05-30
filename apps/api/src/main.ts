import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Casino-api')
    .setDescription('Casino API Documentation')
    .setVersion('1.0')
    .addTag('Casino')
    .addTag('Auth')
    .addBearerAuth()
    .addCookieAuth('session_token')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customCss: '.swagger-ui .models { display: block; }',
  });

  app.setGlobalPrefix('api');
  console.log('API MODULE START SUCCESSFULLY');
  await app.listen(3000);
}
bootstrap();
