import { Module } from '@nestjs/common';

import { GeminiProvider } from './providers/gemini.provider';
import { LLM_PROVIDER_GROUPS, type LlmProvider, type LlmProviderGroup } from './providers/llm-provider';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';
import { AI_CONFIG, type AiConfig, getAiConfig } from './ai.config';
import { LlmService } from './llm.service';

/**
 * 설정에 선언된 provider와 credential 순서대로 인스턴스 group을 만든다.
 * 새 provider를 추가할 때 바뀌는 곳을 이 함수 하나로 제한한다.
 *
 * @param {AiConfig} config - 환경 변수에서 읽은 AI 설정
 * @returns {LlmProviderGroup[]} fallback 우선순위 순서의 provider group
 */
function createLlmProviderGroups(config: AiConfig): LlmProviderGroup[] {
  return config.providerGroups.map(group => ({
    name: group.name,
    credentials: group.credentials.map(createLlmProvider),
  }));
}

/** provider 종류에 맞는 HTTP client를 만든다. */
function createLlmProvider(config: AiConfig['providerGroups'][number]['credentials'][number]): LlmProvider {
  return config.kind === 'gemini' ? new GeminiProvider(config) : new OpenAiCompatibleProvider(config);
}

@Module({
  providers: [
    {
      provide: AI_CONFIG,
      useFactory: getAiConfig,
    },
    {
      provide: LLM_PROVIDER_GROUPS,
      inject: [AI_CONFIG],
      useFactory: createLlmProviderGroups,
    },
    LlmService,
  ],
  exports: [LlmService],
})
export class AiModule {}
