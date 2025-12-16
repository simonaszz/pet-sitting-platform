import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private prisma: PrismaClient;
  private pool: Pool;

  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(this.pool);

    this.prisma = new PrismaClient({
      adapter,
      log: ['query', 'error', 'info', 'warn'],
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...');
    await this.prisma.$connect();
    this.logger.log('Successfully connected to database');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.prisma.$disconnect();
    this.logger.log('Successfully disconnected from database');
  }

  // Delegate all Prisma methods
  get user() {
    return this.prisma.user;
  }

  get pet() {
    return this.prisma.pet;
  }

  get sitterProfile() {
    return this.prisma.sitterProfile;
  }

  get visit() {
    return this.prisma.visit;
  }

  get visitPhoto() {
    return this.prisma.visitPhoto;
  }

  get chat() {
    return this.prisma.chat;
  }

  get message() {
    return this.prisma.message;
  }

  get review() {
    return this.prisma.review;
  }

  get notification() {
    return this.prisma.notification;
  }

  get transaction() {
    return this.prisma.transaction;
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && key[0] !== '_' && key[0] !== '$',
    );

    return Promise.all(
      models.map((modelKey) => {
        const model = (this as Record<string, unknown>)[modelKey as string];
        if (
          model &&
          typeof (model as { deleteMany?: unknown }).deleteMany === 'function'
        ) {
          return (model as { deleteMany: () => unknown }).deleteMany();
        }
      }),
    );
  }
}
