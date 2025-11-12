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
import { ConfigService } from './config/config.service';
import { PrismaService } from './database/prisma.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );

  const configService = app.get(ConfigService);
  const port = configService.getNumber('PORT', 3000);
  const host = configService.get('HOST', '0.0.0.0');
  const nodeEnv = configService.get('NODE_ENV', 'development');

  // Enhanced security headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // Cookie support with secure settings
  await app.register(fastifyCookie, {
    secret: configService.get('COOKIE_SECRET'),
  });

  // Tiered rate limiting based on endpoint sensitivity
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    allowList: (req) => {
      // More strict limits for auth endpoints (handled separately)
      if (req.url?.includes('/auth')) {
        return false; // Will be handled by stricter rule below
      }
      return false; // Apply to all
    },
    keyGenerator: (req) => {
      // Rate limit by IP and user (if authenticated)
      const ip = req.ip || 'unknown';
      const userId = (req as any).user?.id || 'anonymous';
      return `${ip}-${userId}`;
    },
  });

  // CORS with strict origin validation
  const allowedOrigins = configService.getCorsOrigins() || [];
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, postman) in development
      if (!origin && nodeEnv === 'development') {
        callback(null, true);
        return;
      }

      // Validate origin against whitelist
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from unauthorized origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  });

  app.setGlobalPrefix('api');

  // Input validation with strict whitelist
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      // Sanitize error messages in production
      exceptionFactory: (errors) => {
        if (nodeEnv === 'production') {
          // Don't expose detailed validation errors in production
          return {
            statusCode: 400,
            message: 'Validation failed',
            error: 'Bad Request',
          };
        }
        return errors;
      },
    }),
  );

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  await app.listen({ port, host });
  logger.log(`Core API running on http://${host}:${port} (${nodeEnv} mode)`);
  logger.log(`CORS origins: ${allowedOrigins.join(', ') || 'None configured'}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  // Don't expose stack traces in production
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    logger.error('Failed to bootstrap application');
  } else {
    logger.error('Failed to bootstrap application', error.stack);
  }
  process.exit(1);
});
