import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';

import { ApiExceptionFilter } from './common/filters';
import { PrismaService } from './database/prisma';
import { AppModule } from './app.module';
import { createWinstonLoggerOptions, getAppConfig } from './config';

async function bootstrap(): Promise<void> {
  const logger = WinstonModule.createLogger(createWinstonLoggerOptions());
  const app = await NestFactory.create(AppModule, { logger });
  const appConfig = getAppConfig();
  const prismaService = app.get(PrismaService);

  app.enableCors();

  // 모든 예외를 ApiFailResponse 형식으로 통일한다 (성공 응답과 같은 envelope)
  app.useGlobalFilters(new ApiExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('JamPlay API')
    .setDescription('JamPlay 밴드 협업 플랫폼 API 명세')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: '액세스 토큰' }, 'access-token')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: '리프레시 토큰' }, 'refresh-token')
    .addBasicAuth({ type: 'http', scheme: 'basic', description: '이메일:비밀번호 Base64 인코딩' })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await prismaService.enableShutdownHooks(app);

  await app.listen(appConfig.port);
}

void bootstrap();
