import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';

import { AppModule } from './app/app.module';
import { AppConfigService } from './config/config.service';
import { PrismaService } from './database/prisma.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );

  const configService = app.get(AppConfigService);
  const port = configService.getNumber('PORT', 3000);
  const host = configService.get('HOST');

  await app.register(helmet);
  await app.register(fastifyCookie, {
    secret: configService.get('COOKIE_SECRET'),
  });
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
  });

  app.enableCors({
    origin: configService.getCorsOrigins(),
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  await app.listen({ port, host });
  logger.log(`Core API running on http://${host}:${port}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to bootstrap application', error.stack);
  process.exit(1);
});
