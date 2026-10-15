import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma';
import { Prisma } from 'src/generated/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { ADMIN_SKILL_TYPES_REPOSITORY, type AdminSkillTypesRepository } from './repositories/admin-skill-types.repository';
import type { AdminSkillTypeItem, CreateMasterDataInput, UpdateMasterDataInput } from './types/admin-master-data.type';

const DUPLICATE_SKILL_TYPE_NAME_MESSAGE = '이미 같은 이름의 세션이 있습니다.';

@Injectable()
export class AdminSkillTypesService {
  constructor(
    @Inject(ADMIN_SKILL_TYPES_REPOSITORY)
    private readonly adminSkillTypesRepository: AdminSkillTypesRepository,
    private readonly auditLogsService: AdminAuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 세션 전체를 편성 순서대로 사용 횟수와 함께 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ skillTypes: AdminSkillTypeItem[] }>} 세션 목록
   */
  async getSkillTypes(tx?: Prisma.TransactionClient): Promise<{ skillTypes: AdminSkillTypeItem[] }> {
    const skillTypes = await this.adminSkillTypesRepository.findSkillTypes(tx);
    return { skillTypes };
  }

  /**
   * 세션을 추가한다. sortOrder를 생략하면 기존 최대값 + 1(세션이 없으면 0)로 맨 뒤에 둔다.
   *
   * @param {AdminPrincipal} admin - 요청한 어드민
   * @param {CreateMasterDataInput} input - 이름(앞뒤 공백 제거됨)과 선택 sortOrder
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminSkillTypeItem>} 생성된 세션
   */
  async createSkillType(admin: AdminPrincipal, input: CreateMasterDataInput, tx?: Prisma.TransactionClient): Promise<AdminSkillTypeItem> {
    const run = async (client: Prisma.TransactionClient): Promise<AdminSkillTypeItem> => {
      const duplicate = await this.adminSkillTypesRepository.findSkillTypeIdByName(input.name, client);
      if (duplicate !== null) {
        throw new ConflictException(DUPLICATE_SKILL_TYPE_NAME_MESSAGE);
      }

      const sortOrder = input.sortOrder ?? (await this.findNextSortOrder(client));
      const created = await this.saveWithDuplicateNameGuard(() =>
        this.adminSkillTypesRepository.createSkillType({ name: input.name, sortOrder }, client),
      );
      await this.auditLogsService.record(
        {
          adminUserId: admin.id,
          action: 'SKILL_TYPE_CREATE',
          targetType: 'SKILL_TYPE',
          targetId: created.skillTypeId,
          detail: { name: created.name, sortOrder: created.sortOrder },
        },
        client,
      );

      return created;
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 세션 이름·순서를 바꾼다.
   *
   * @param {AdminPrincipal} admin - 요청한 어드민
   * @param {string} skillTypeId - 세션 ID
   * @param {UpdateMasterDataInput} input - 변경 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminSkillTypeItem>} 수정된 세션
   */
  async updateSkillType(
    admin: AdminPrincipal,
    skillTypeId: string,
    input: UpdateMasterDataInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AdminSkillTypeItem> {
    const run = async (client: Prisma.TransactionClient): Promise<AdminSkillTypeItem> => {
      await this.findSkillType(skillTypeId, client);

      if (input.name !== undefined) {
        const duplicate = await this.adminSkillTypesRepository.findSkillTypeIdByName(input.name, client);
        const isOtherSkillType = duplicate !== null && duplicate.id !== skillTypeId;
        if (isOtherSkillType) {
          throw new ConflictException(DUPLICATE_SKILL_TYPE_NAME_MESSAGE);
        }
      }

      const updated = await this.saveWithDuplicateNameGuard(() =>
        this.adminSkillTypesRepository.updateSkillType(skillTypeId, { name: input.name, sortOrder: input.sortOrder }, client),
      );
      await this.auditLogsService.record(
        {
          adminUserId: admin.id,
          action: 'SKILL_TYPE_UPDATE',
          targetType: 'SKILL_TYPE',
          targetId: skillTypeId,
          detail: { name: updated.name, sortOrder: updated.sortOrder },
        },
        client,
      );

      return updated;
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 세션을 삭제한다.
   * user_skills·song_skills FK는 CASCADE, team_members·schedule_participants FK는 SET NULL이라
   * 사용 중인 세션을 지우면 유저 스킬·곡 편성이 사라지고 팀·일정의 세션 배정이 비워지므로 막는다.
   *
   * @param {AdminPrincipal} admin - 요청한 어드민
   * @param {string} skillTypeId - 세션 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ skillTypeId: string }>} 삭제된 세션 ID
   */
  async deleteSkillType(admin: AdminPrincipal, skillTypeId: string, tx?: Prisma.TransactionClient): Promise<{ skillTypeId: string }> {
    const run = async (client: Prisma.TransactionClient): Promise<{ skillTypeId: string }> => {
      const skillType = await this.findSkillType(skillTypeId, client);
      if (skillType.usageCount > 0) {
        throw new ConflictException(`유저·곡·팀·일정 ${skillType.usageCount}건에서 사용 중인 세션은 삭제할 수 없습니다.`);
      }

      await this.adminSkillTypesRepository.deleteSkillType(skillTypeId, client);
      await this.auditLogsService.record(
        {
          adminUserId: admin.id,
          action: 'SKILL_TYPE_DELETE',
          targetType: 'SKILL_TYPE',
          targetId: skillTypeId,
          detail: { name: skillType.name, sortOrder: skillType.sortOrder },
        },
        client,
      );

      return { skillTypeId };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /** 세션을 찾고, 없으면 404를 던진다. */
  private async findSkillType(skillTypeId: string, client: Prisma.TransactionClient): Promise<AdminSkillTypeItem> {
    const skillType = await this.adminSkillTypesRepository.findSkillTypeById(skillTypeId, client);
    if (skillType === null) {
      throw new NotFoundException('세션을 찾을 수 없습니다.');
    }

    return skillType;
  }

  /** 새 세션을 맨 뒤에 두기 위한 순서. 세션이 없으면 0부터 시작한다. */
  private async findNextSortOrder(client: Prisma.TransactionClient): Promise<number> {
    const maxSortOrder = await this.adminSkillTypesRepository.findMaxSkillTypeSortOrder(client);
    if (maxSortOrder === null) {
      return 0;
    }

    return maxSortOrder + 1;
  }

  /**
   * 사전 중복 검사와 저장 사이에 같은 이름이 끼어들 수 있어,
   * name 유니크 제약 위반(P2002)도 사전 검사와 같은 409로 바꾼다.
   */
  private async saveWithDuplicateNameGuard<T>(save: () => Promise<T>): Promise<T> {
    try {
      return await save();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(DUPLICATE_SKILL_TYPE_NAME_MESSAGE);
      }
      throw error;
    }
  }
}
