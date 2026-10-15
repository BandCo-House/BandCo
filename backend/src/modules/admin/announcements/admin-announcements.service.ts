import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PaginationParams } from 'src/common/pagination';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import { type AdminPaginatedResult, toAdminPaginatedResult } from '../core/types/admin-paginated.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { ADMIN_ANNOUNCEMENTS_REPOSITORY, type AdminAnnouncementsRepository } from './repositories/admin-announcements.repository';
import type { AdminAnnouncement, CreateAnnouncementInput, UpdateAnnouncementData, UpdateAnnouncementInput } from './types/admin-announcement.type';

const ANNOUNCEMENT_NOT_FOUND_MESSAGE = '공지를 찾을 수 없습니다.';
const INVALID_ANNOUNCEMENT_PERIOD_MESSAGE = '게시 시작 시각은 종료 시각보다 이전이어야 합니다.';

/** ISO 8601 문자열을 Date로 바꾼다. 값이 없으면 기간 제한이 없다는 뜻이므로 null이다. */
function toDateOrNull(value: string | null | undefined): Date | null {
  if (value === undefined || value === null) {
    return null;
  }

  return new Date(value);
}

/**
 * 게시 시작과 종료가 모두 있을 때 시작이 종료보다 앞서는지 검증한다.
 * 같은 시각이면 노출되는 순간이 없으므로 함께 거부한다.
 */
function assertAnnouncementPeriod(startsAt: Date | null, endsAt: Date | null): void {
  if (startsAt === null || endsAt === null) {
    return;
  }
  if (startsAt.getTime() >= endsAt.getTime()) {
    throw new BadRequestException(INVALID_ANNOUNCEMENT_PERIOD_MESSAGE);
  }
}

@Injectable()
export class AdminAnnouncementsService {
  constructor(
    @Inject(ADMIN_ANNOUNCEMENTS_REPOSITORY)
    private readonly announcementsRepository: AdminAnnouncementsRepository,
    private readonly auditLogsService: AdminAuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 공지를 최신 생성순으로 조회한다.
   *
   * @param {PaginationParams} pagination - 페이지 정보
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminPaginatedResult<AdminAnnouncement>>} 공지 목록
   */
  async getAnnouncements(pagination: PaginationParams, tx?: Prisma.TransactionClient): Promise<AdminPaginatedResult<AdminAnnouncement>> {
    const { items, totalCount } = await this.announcementsRepository.findMany(pagination, tx);
    return toAdminPaginatedResult(items, totalCount, pagination);
  }

  /**
   * 공지를 만들고 감사 로그를 남긴다.
   *
   * @param {AdminPrincipal} actor - 요청한 어드민
   * @param {CreateAnnouncementInput} input - 생성 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminAnnouncement>} 생성된 공지
   */
  async createAnnouncement(actor: AdminPrincipal, input: CreateAnnouncementInput, tx?: Prisma.TransactionClient): Promise<AdminAnnouncement> {
    const run = async (client: Prisma.TransactionClient): Promise<AdminAnnouncement> => {
      const startsAt = toDateOrNull(input.startsAt);
      const endsAt = toDateOrNull(input.endsAt);
      assertAnnouncementPeriod(startsAt, endsAt);

      const created = await this.announcementsRepository.create(
        { title: input.title, content: input.content, isPublished: input.isPublished, startsAt, endsAt, createdByAdminId: actor.id },
        client,
      );
      await this.auditLogsService.record(
        {
          adminUserId: actor.id,
          action: 'ANNOUNCEMENT_CREATE',
          targetType: 'ANNOUNCEMENT',
          targetId: created.announcementId,
          detail: { title: created.title, isPublished: created.isPublished },
        },
        client,
      );

      return created;
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 공지를 부분 수정하고 감사 로그를 남긴다.
   * 게시 기간은 한쪽만 바뀌어도 어긋날 수 있어 기존 값과 합친 최종 값으로 검증한다.
   *
   * @param {AdminPrincipal} actor - 요청한 어드민
   * @param {string} announcementId - 공지 ID
   * @param {UpdateAnnouncementInput} input - 바꿀 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminAnnouncement>} 수정된 공지
   */
  async updateAnnouncement(
    actor: AdminPrincipal,
    announcementId: string,
    input: UpdateAnnouncementInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AdminAnnouncement> {
    const run = async (client: Prisma.TransactionClient): Promise<AdminAnnouncement> => {
      const existing = await this.announcementsRepository.findById(announcementId, client);
      if (existing === null) {
        throw new NotFoundException(ANNOUNCEMENT_NOT_FOUND_MESSAGE);
      }

      const nextStartsAt = input.startsAt !== undefined ? toDateOrNull(input.startsAt) : toDateOrNull(existing.startsAt);
      const nextEndsAt = input.endsAt !== undefined ? toDateOrNull(input.endsAt) : toDateOrNull(existing.endsAt);
      assertAnnouncementPeriod(nextStartsAt, nextEndsAt);

      const data: UpdateAnnouncementData = {
        title: input.title,
        content: input.content,
        isPublished: input.isPublished,
        startsAt: input.startsAt !== undefined ? nextStartsAt : undefined,
        endsAt: input.endsAt !== undefined ? nextEndsAt : undefined,
      };
      const updated = await this.announcementsRepository.update(announcementId, data, client);

      // 본문은 길 수 있어 값 대신 바뀐 필드 이름만 남긴다.
      const changedFields = Object.entries(input)
        .filter(([, value]) => value !== undefined)
        .map(([field]) => field);
      await this.auditLogsService.record(
        { adminUserId: actor.id, action: 'ANNOUNCEMENT_UPDATE', targetType: 'ANNOUNCEMENT', targetId: announcementId, detail: { changedFields } },
        client,
      );

      return updated;
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 공지를 삭제하고 감사 로그를 남긴다.
   *
   * @param {AdminPrincipal} actor - 요청한 어드민
   * @param {string} announcementId - 공지 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ announcementId: string }>} 삭제된 공지 ID
   */
  async deleteAnnouncement(actor: AdminPrincipal, announcementId: string, tx?: Prisma.TransactionClient): Promise<{ announcementId: string }> {
    const run = async (client: Prisma.TransactionClient): Promise<{ announcementId: string }> => {
      const existing = await this.announcementsRepository.findById(announcementId, client);
      if (existing === null) {
        throw new NotFoundException(ANNOUNCEMENT_NOT_FOUND_MESSAGE);
      }

      await this.announcementsRepository.delete(announcementId, client);
      await this.auditLogsService.record(
        {
          adminUserId: actor.id,
          action: 'ANNOUNCEMENT_DELETE',
          targetType: 'ANNOUNCEMENT',
          targetId: announcementId,
          detail: { title: existing.title },
        },
        client,
      );

      return { announcementId };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }
}
