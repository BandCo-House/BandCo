import { Inject, Injectable } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma';

import { SKILLS_REPOSITORY, type SkillsRepository } from './repositories/skills.repository';
import type { ExistingSkillTypeIdsResult } from './types/existing-skill-type-ids-result.type';

@Injectable()
export class SkillsService {
  constructor(
    @Inject(SKILLS_REPOSITORY)
    private readonly skillsRepository: SkillsRepository,
  ) {}

  async findExistingSkillTypeIds(skillTypeIds: string[], tx?: Prisma.TransactionClient): Promise<ExistingSkillTypeIdsResult> {
    return this.skillsRepository.findExistingSkillTypeIds(skillTypeIds, tx);
  }
}
