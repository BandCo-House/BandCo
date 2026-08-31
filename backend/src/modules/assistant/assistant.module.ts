import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { AiModule } from '../ai/ai.module';
import { UsersModule } from '../users/users.module';

import { AssistantScopeResolver } from './execution/assistant-scope.resolver';
import { AnswerRenderer } from './rendering/answer-renderer';
import { AssistantPrismaRepository } from './repositories/assistant.prisma-repository';
import { ASSISTANT_REPOSITORY } from './repositories/assistant.repository';
import { SqlQueryValidator } from './sql/sql-query.validator';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

@Module({
  imports: [AuthModule, UsersModule, AiModule],
  controllers: [AssistantController],
  providers: [
    AccessTokenGuard,
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
