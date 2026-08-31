import { Module } from '@nestjs/common';

import { GeminiProvider } from './providers/gemini.provider';
import { LLM_PROVIDERS, type LlmProvider } from './providers/llm-provider';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';
import { getAiConfig } from './ai.config';
import { LlmService } from './llm.service';

/**
 * 설정에 선언된 순서대로 provider 인스턴스를 만든다.
 * 새 provider를 추가할 때 바뀌는 곳을 이 함수 하나로 제한한다.
 *
 * @returns {LlmProvider[]} fallback 우선순위 순서의 provider 목록
 */
function createLlmProviders(): LlmProvider[] {
  return getAiConfig().providers.map(config => (config.kind === 'gemini' ? new GeminiProvider(config) : new OpenAiCompatibleProvider(config)));
}

@Module({
  providers: [
    {
      provide: LLM_PROVIDERS,
      useFactory: createLlmProviders,
    },
    LlmService,
  ],
  exports: [LlmService],
})
export class AiModule {}
