import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';

import { PrismaService } from './database/prisma';
import { AppModule } from './app.module';
import { createWinstonLoggerOptions, getAppConfig } from './config';

async function bootstrap(): Promise<void> {
  const logger = WinstonModule.createLogger(createWinstonLoggerOptions());
  const app = await NestFactory.create(AppModule, { logger });
  const appConfig = getAppConfig();
  const prismaService = app.get(PrismaService);
  const swaggerConfig = new DocumentBuilder().setTitle('Jamplay Backend API').setDescription('Jamplay 백엔드 API 문서').setVersion('1.0.0').build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  await prismaService.enableShutdownHooks(app);

  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(appConfig.port);
}

void bootstrap();
