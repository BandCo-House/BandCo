import type { PaginationParams } from 'src/common/pagination';
import type { BandMemberRole, Prisma } from 'src/generated/prisma';

import type { AdminBandDetailRecord, AdminBandListFilter, AdminBandListItem, AdminBandMembership, AdminBandState } from '../types/admin-band.type';

export const ADMIN_BANDS_REPOSITORY = Symbol('ADMIN_BANDS_REPOSITORY');

export interface AdminBandsRepository {
  /**
   * 조건에 맞는 밴드를 최신 생성순으로 한 페이지 조회한다.
   *
   * @param {AdminBandListFilter} filter - 키워드·삭제 포함 여부
   * @param {PaginationParams} pagination - 페이지 정보
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ items: AdminBandListItem[]; totalCount: number }>} 한 페이지와 전체 개수
   */
  findBands(
    filter: AdminBandListFilter,
    pagination: PaginationParams,
    tx?: Prisma.TransactionClient,
  ): Promise<{ items: AdminBandListItem[]; totalCount: number }>;

  /**
   * 삭제된 밴드까지 포함해 밴드 상세를 조회한다.
   *
   * @param {string} bandId - 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminBandDetailRecord | null>} 밴드 상세 또는 null
   */
  findBandDetail(bandId: string, tx?: Prisma.TransactionClient): Promise<AdminBandDetailRecord | null>;

  /**
   * 삭제된 밴드까지 포함해 밴드의 현재 상태를 조회한다.
   *
   * @param {string} bandId - 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminBandState | null>} 밴드 상태 또는 null
   */
  findBandState(bandId: string, tx?: Prisma.TransactionClient): Promise<AdminBandState | null>;

  /**
   * 유저의 밴드 멤버십을 조회한다.
   *
   * @param {string} bandId - 밴드 ID
   * @param {string} userId - 유저 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminBandMembership | null>} 멤버십 또는 null
   */
  findBandMembership(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<AdminBandMembership | null>;

  /**
   * 밴드 멤버의 역할을 바꾼다.
   *
   * @param {string} bandMemberId - 밴드 멤버 ID
   * @param {BandMemberRole} role - 새 역할
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<void>} 변경 완료
   */
  updateBandMemberRole(bandMemberId: string, role: BandMemberRole, tx?: Prisma.TransactionClient): Promise<void>;

  /**
   * 밴드의 밴드장(bands.bm_id)을 바꾼다.
   *
   * @param {string} bandId - 밴드 ID
   * @param {string} bandMasterUserId - 새 밴드장 유저 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<void>} 변경 완료
   */
  updateBandMaster(bandId: string, bandMasterUserId: string, tx?: Prisma.TransactionClient): Promise<void>;

  /**
   * 밴드 초대 링크의 만료 시각을 조회한다. 밴드당 링크는 최대 1개다.
   *
   * @param {string} bandId - 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ expiredAt: Date | null } | null>} 링크 만료 시각 또는 링크 없음(null)
   */
  findBandInviteLink(bandId: string, tx?: Prisma.TransactionClient): Promise<{ expiredAt: Date | null } | null>;

  /**
   * 밴드 초대 링크의 만료 시각을 바꾼다.
   *
   * @param {string} bandId - 밴드 ID
   * @param {Date} expiredAt - 새 만료 시각
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<void>} 변경 완료
   */
  updateBandInviteLinkExpiredAt(bandId: string, expiredAt: Date, tx?: Prisma.TransactionClient): Promise<void>;

  /**
   * 밴드의 삭제 시각을 바꾼다. null이면 복구된다.
   *
   * @param {string} bandId - 밴드 ID
   * @param {Date | null} deletedAt - 삭제 시각 또는 null
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<void>} 변경 완료
   */
  updateBandDeletedAt(bandId: string, deletedAt: Date | null, tx?: Prisma.TransactionClient): Promise<void>;
}
