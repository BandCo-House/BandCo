import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import type { AdminSkillTypeItem } from '../types/admin-master-data.type';

import type { AdminSkillTypesRepository } from './admin-skill-types.repository';

/** 세션과 함께 사용 횟수 계산에 필요한 관계 개수를 읽는다. */
const SKILL_TYPE_SELECT = {
  id: true,
  name: true,
  sortOrder: true,
  _count: { select: { userSkills: true, songSkills: true, teamMembers: true, scheduleParticipants: true } },
} satisfies Prisma.SkillTypeSelect;

type SkillTypeRow = Prisma.SkillTypeGetPayload<{ select: typeof SKILL_TYPE_SELECT }>;

function toAdminSkillTypeItem(skillType: SkillTypeRow): AdminSkillTypeItem {
  const counts = skillType._count;
  return {
    skillTypeId: skillType.id,
    name: skillType.name,
    sortOrder: skillType.sortOrder,
    usageCount: counts.userSkills + counts.songSkills + counts.teamMembers + counts.scheduleParticipants,
  };
}

@Injectable()
export class AdminSkillTypesPrismaRepository implements AdminSkillTypesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSkillTypes(tx?: Prisma.TransactionClient): Promise<AdminSkillTypeItem[]> {
    const client = tx ?? this.prisma;
    const skillTypes = await client.skillType.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: SKILL_TYPE_SELECT });
    return skillTypes.map(toAdminSkillTypeItem);
  }

  async findSkillTypeById(skillTypeId: string, tx?: Prisma.TransactionClient): Promise<AdminSkillTypeItem | null> {
    const client = tx ?? this.prisma;
    const skillType = await client.skillType.findUnique({ where: { id: skillTypeId }, select: SKILL_TYPE_SELECT });
    if (skillType === null) {
      return null;
    }

    return toAdminSkillTypeItem(skillType);
  }

  async findSkillTypeIdByName(name: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null> {
    const client = tx ?? this.prisma;
    return client.skillType.findUnique({ where: { name }, select: { id: true } });
  }

  async findMaxSkillTypeSortOrder(tx?: Prisma.TransactionClient): Promise<number | null> {
    const client = tx ?? this.prisma;
    const result = await client.skillType.aggregate({ _max: { sortOrder: true } });
    return result._max.sortOrder;
  }

  async createSkillType(data: { name: string; sortOrder: number }, tx?: Prisma.TransactionClient): Promise<AdminSkillTypeItem> {
    const client = tx ?? this.prisma;
    const skillType = await client.skillType.create({ data, select: SKILL_TYPE_SELECT });
    return toAdminSkillTypeItem(skillType);
  }

  async updateSkillType(
    skillTypeId: string,
    data: { name?: string; sortOrder?: number },
    tx?: Prisma.TransactionClient,
  ): Promise<AdminSkillTypeItem> {
    const client = tx ?? this.prisma;
    const skillType = await client.skillType.update({ where: { id: skillTypeId }, data, select: SKILL_TYPE_SELECT });
    return toAdminSkillTypeItem(skillType);
  }

  async deleteSkillType(skillTypeId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.skillType.delete({ where: { id: skillTypeId } });
  }
}
