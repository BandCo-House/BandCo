import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma';
import { ASSISTANT_REPOSITORY, type AssistantRepository } from '../repositories/assistant.repository';
import type { AssistantScope } from '../types/assistant-scope.type';

@Injectable()
export class AssistantScopeResolver {
  constructor(@Inject(ASSISTANT_REPOSITORY) private readonly repository: AssistantRepository) {}

  /**
   * 인증 정보로부터 조회 범위를 결정한다.
   * 기존 일정 목록 API가 밴드 멤버십을 기준으로 하므로 어시스턴트도 같은 기준을 쓴다.
   * 두 경로의 기준이 갈리면 어시스턴트가 기존 화면보다 넓게 보이는 문제가 생긴다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} bandId - 질문 대상 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 호출자가 전달한 transaction
   * @returns {Promise<AssistantScope>} 조회에 사용할 범위
   */
  async resolve(userId: string, bandId: string, tx?: Prisma.TransactionClient): Promise<AssistantScope> {
    const bandMember = await this.repository.findBandMemberByBandIdAndUserId(bandId, userId, tx);

    if (bandMember === null) {
      throw new ForbiddenException('해당 밴드의 멤버가 아닙니다.');
    }

    return { userId, bandId, bandMemberId: bandMember.id };
  }
}
