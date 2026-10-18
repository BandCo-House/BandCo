import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from '../../auth/auth.module';
import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { AiModule } from '../ai/ai.module';
import { UsersModule } from '../users/users.module';

import { AssistantScopeResolver } from './execution/assistant-scope.resolver';
import { ASSISTANT_RATE_LIMIT_NAME, getAssistantRateLimitConfig } from './rate-limit/assistant-rate-limit.config';
import { AssistantRateLimitGuard } from './rate-limit/assistant-rate-limit.guard';
import { AnswerRenderer } from './rendering/answer-renderer';
import { AssistantPrismaRepository } from './repositories/assistant.prisma-repository';
import { ASSISTANT_REPOSITORY } from './repositories/assistant.repository';
import { SqlQueryValidator } from './sql/sql-query.validator';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    AiModule,
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const config = getAssistantRateLimitConfig();

        return [
          {
            name: ASSISTANT_RATE_LIMIT_NAME,
            ttl: config.windowMs,
            limit: config.maxRequests,
          },
        ];
      },
    }),
  ],
  controllers: [AssistantController],
  providers: [
    AccessTokenGuard,
    AssistantRateLimitGuard,
    AssistantService,
    AssistantScopeResolver,
    SqlQueryValidator,
    AnswerRenderer,
    AssistantPrismaRepository,
    {
      provide: ASSISTANT_REPOSITORY,
      useExisting: AssistantPrismaRepository,
    },
  ],
})
export class AssistantModule {}
