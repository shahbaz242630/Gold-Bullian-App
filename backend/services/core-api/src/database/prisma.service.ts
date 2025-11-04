import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.();
  }

  async onModuleDestroy() {
    await this.();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.('beforeExit', async () => {
      await app.close();
    });
  }
}

