import type { INestApplication, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { getDatabaseConfig } from '../../config';

import { createPrismaClientOptions } from './prisma.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const databaseConfig = getDatabaseConfig();
    const prismaClientOptions = createPrismaClientOptions({
      nodeEnv: process.env.NODE_ENV,
    });

    super({
      ...prismaClientOptions,
      datasources: {
        db: {
          url: databaseConfig.databaseUrl,
        },
      },
    });
  }

  /**
   * 앱 시작 시 DB 연결 문제를 바로 드러내야 요청 처리 중간에 늦게 실패하지 않는다.
   *
   * @returns {Promise<void>} DB 연결 완료
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * 종료 시 연결을 닫아 개발 서버 재시작과 테스트 종료를 더 안정적으로 만든다.
   *
   * @returns {Promise<void>} DB 연결 종료
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Prisma 종료 시점과 Nest 종료 흐름을 묶어 잔여 프로세스가 남는 문제를 줄인다.
   *
   * @param {INestApplication} app - 현재 Nest 애플리케이션 인스턴스
   * @returns {Promise<void>} 종료 훅 연결 완료
   */
  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.once('beforeExit', () => {
      void app.close();
    });
  }
}
