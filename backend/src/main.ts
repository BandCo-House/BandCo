import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';

import { ApiExceptionFilter } from './common/filters';
import { requestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { PrismaService } from './database/prisma';
import { AppModule } from './app.module';
import { createWinstonLoggerOptions, getAppConfig } from './config';

async function bootstrap(): Promise<void> {
  const logger = WinstonModule.createLogger(createWinstonLoggerOptions());
  const app = await NestFactory.create(AppModule, { logger });
  const appConfig = getAppConfig();
  const prismaService = app.get(PrismaService);

  // Date 헤더는 CORS 기본 노출 목록에 없어 브라우저 JS가 읽을 수 없다.
  // 프론트가 서버 시각을 알아야 마감 같은 경계를 클라이언트 시계로 오판하지 않는다.
  app.enableCors({ exposedHeaders: ['Date'] });

  // 모든 예외를 ApiFailResponse 형식으로 통일한다 (성공 응답과 같은 envelope)
  app.useGlobalFilters(new ApiExceptionFilter());
  app.use(requestLoggingMiddleware);

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
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: '어드민 액세스 토큰' }, 'admin-access-token')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: '어드민 리프레시 토큰' }, 'admin-refresh-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await prismaService.enableShutdownHooks(app);

  await app.listen(appConfig.port);
}

void bootstrap();
