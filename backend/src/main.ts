import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const redisAdapter = new RedisIoAdapter(app, configService);
  await redisAdapter.connectToRedis();
  app.useWebSocketAdapter(redisAdapter);

  const frontendUrl = configService.get<string>('FRONTEND_URL');

  app.enableCors({
    origin: [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      ...(frontendUrl ? [frontendUrl] : []),
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(configService.get('PORT') ?? 3000);
}

bootstrap();
