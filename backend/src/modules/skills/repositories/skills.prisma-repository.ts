import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { ExistingSkillTypeIdsResult } from '../types/existing-skill-type-ids-result.type';

import type { SkillsRepository } from './skills.repository';

@Injectable()
export class SkillsPrismaRepository implements SkillsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 요청받은 세션 타입 ID가 실제로 존재하는지 확인한다.
   *
   * @param {string[]} skillTypeIds - 확인할 세션 타입 ID 목록
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<ExistingSkillTypeIdsResult>} 존재하는 세션 타입 ID 목록
   */
  async findExistingSkillTypeIds(skillTypeIds: string[], tx?: Prisma.TransactionClient): Promise<ExistingSkillTypeIdsResult> {
    const client = tx ?? this.prisma;

    const skillTypes = await client.skillType.findMany({
      where: {
        id: {
          in: skillTypeIds,
        },
      },
      select: {
        id: true,
      },
    });

    return {
      skillTypeIds: skillTypes.map(skillType => skillType.id),
    };
  }
}
