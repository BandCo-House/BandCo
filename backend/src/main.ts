import { NestFactory } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';

import { PrismaService } from './database/prisma';
import { AppModule } from './app.module';
import { createWinstonLoggerOptions, getAppConfig } from './config';

async function bootstrap(): Promise<void> {
  const logger = WinstonModule.createLogger(createWinstonLoggerOptions());
  const app = await NestFactory.create(AppModule, { logger });
  const appConfig = getAppConfig();
  const prismaService = app.get(PrismaService);

  await prismaService.enableShutdownHooks(app);

  await app.listen(appConfig.port);
}

void bootstrap();
