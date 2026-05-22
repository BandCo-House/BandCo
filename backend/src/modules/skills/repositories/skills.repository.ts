import type { Prisma } from '../../../generated/prisma';
import type { ExistingSkillTypeIdsResult } from '../types/existing-skill-type-ids-result.type';

export const SKILLS_REPOSITORY = Symbol('SKILLS_REPOSITORY');

export interface SkillsRepository {
  findExistingSkillTypeIds(skillTypeIds: string[], tx?: Prisma.TransactionClient): Promise<ExistingSkillTypeIdsResult>;
}
