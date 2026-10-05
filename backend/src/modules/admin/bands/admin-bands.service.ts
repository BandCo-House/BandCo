import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PaginationParams } from 'src/common/pagination';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import { type AdminPaginatedResult, toAdminPaginatedResult } from '../core/types/admin-paginated.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { ADMIN_BANDS_REPOSITORY, type AdminBandsRepository } from './repositories/admin-bands.repository';
import type {
  AdminBandDetail,
  AdminBandListFilter,
  AdminBandListItem,
  AdminBandState,
  DeleteBandResult,
  ExpireBandInviteLinkResult,
  RestoreBandResult,
  TransferBandMasterResult,
} from './types/admin-band.type';

@Injectable()
export class AdminBandsService {
  constructor(
    @Inject(ADMIN_BANDS_REPOSITORY)
    private readonly adminBandsRepository: AdminBandsRepository,
    private readonly auditLogsService: AdminAuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 밴드 목록을 최신 생성순으로 조회한다. 기본은 삭제되지 않은 밴드만 보여준다.
   *
   * @param {AdminBandListFilter} filter - 키워드·삭제 포함 여부
   * @param {PaginationParams} pagination - 페이지 정보
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminPaginatedResult<AdminBandListItem>>} 밴드 목록
   */
  async getBands(
    filter: AdminBandListFilter,
    pagination: PaginationParams,
    tx?: Prisma.TransactionClient,
  ): Promise<AdminPaginatedResult<AdminBandListItem>> {
    const { items, totalCount } = await this.adminBandsRepository.findBands(filter, pagination, tx);
    return toAdminPaginatedResult(items, totalCount, pagination);
  }

  /**
   * 밴드 상세를 조회한다. 삭제된 밴드도 복구 판단을 위해 조회할 수 있다.
   *
   * @param {string} bandId - 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminBandDetail>} 밴드 상세
   */
  async getBand(bandId: string, tx?: Prisma.TransactionClient): Promise<AdminBandDetail> {
    const record = await this.adminBandsRepository.findBandDetail(bandId, tx);
    if (record === null) {
      throw new NotFoundException('밴드를 찾을 수 없습니다.');
    }

    const { inviteLinkExpiredAt, ...detail } = record;

    // 만료된 링크는 가입에 쓸 수 없으므로 유저용 초대 링크 조회와 같은 기준으로 "없음"으로 본다.
    const hasActiveLink = inviteLinkExpiredAt !== null && inviteLinkExpiredAt.getTime() > Date.now();
    if (!hasActiveLink) {
      return { ...detail, inviteLink: { hasActiveLink: false, expiredAt: null } };
    }

    return { ...detail, inviteLink: { hasActiveLink: true, expiredAt: inviteLinkExpiredAt.toISOString() } };
  }

  /**
   * 밴드장을 다른 멤버에게 넘긴다.
   * 밴드장이 탈퇴·잠수해 밴드를 관리할 사람이 없을 때 운영자가 대신 넘겨주기 위한 기능이다.
   * 기존 밴드장이 아직 멤버로 남아 있으면 관리 권한을 잃지 않도록 ADMIN으로 내린다.
   *
   * @param {AdminPrincipal} admin - 요청한 어드민
   * @param {string} bandId - 밴드 ID
   * @param {string} targetUserId - 새 밴드장 유저 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<TransferBandMasterResult>} 새 밴드장과 이전 밴드장
   */
  async transferBandMaster(
    admin: AdminPrincipal,
    bandId: string,
    targetUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<TransferBandMasterResult> {
    const run = async (client: Prisma.TransactionClient): Promise<TransferBandMasterResult> => {
      const band = await this.findActiveBand(bandId, client);

      if (band.bandMasterUserId === targetUserId) {
        throw new BadRequestException('이미 밴드장인 유저입니다.');
      }

      const targetMembership = await this.adminBandsRepository.findBandMembership(bandId, targetUserId, client);
      if (targetMembership === null) {
        throw new BadRequestException('밴드 멤버가 아닌 유저에게는 밴드장을 넘길 수 없습니다.');
      }
      if (targetMembership.isUserDeleted) {
        throw new BadRequestException('탈퇴한 회원에게는 밴드장을 넘길 수 없습니다.');
      }

      const previousBandMasterUserId = band.bandMasterUserId;
      const previousMasterMembership = await this.adminBandsRepository.findBandMembership(bandId, previousBandMasterUserId, client);
      if (previousMasterMembership !== null) {
        await this.adminBandsRepository.updateBandMemberRole(previousMasterMembership.id, 'ADMIN', client);
      }

      await this.adminBandsRepository.updateBandMemberRole(targetMembership.id, 'BM', client);
      await this.adminBandsRepository.updateBandMaster(bandId, targetUserId, client);
      await this.auditLogsService.record(
        {
          adminUserId: admin.id,
          action: 'BAND_MASTER_TRANSFER',
          targetType: 'BAND',
          targetId: bandId,
          detail: { from: previousBandMasterUserId, to: targetUserId },
        },
        client,
      );

      return { bandId, bandMasterUserId: targetUserId, previousBandMasterUserId };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 밴드 초대 링크를 즉시 만료시킨다. 링크가 외부에 퍼져 원치 않는 가입이 생길 때 쓴다.
   *
   * @param {AdminPrincipal} admin - 요청한 어드민
   * @param {string} bandId - 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<ExpireBandInviteLinkResult>} 새 만료 시각
   */
  async expireBandInviteLink(admin: AdminPrincipal, bandId: string, tx?: Prisma.TransactionClient): Promise<ExpireBandInviteLinkResult> {
    const run = async (client: Prisma.TransactionClient): Promise<ExpireBandInviteLinkResult> => {
      await this.findActiveBand(bandId, client);

      const now = new Date();
      const inviteLink = await this.adminBandsRepository.findBandInviteLink(bandId, client);
      const hasActiveLink = inviteLink !== null && inviteLink.expiredAt !== null && inviteLink.expiredAt.getTime() > now.getTime();
      if (!hasActiveLink) {
        throw new BadRequestException('활성화된 초대 링크가 없습니다.');
      }

      await this.adminBandsRepository.updateBandInviteLinkExpiredAt(bandId, now, client);
      await this.auditLogsService.record({ adminUserId: admin.id, action: 'BAND_INVITE_LINK_EXPIRE', targetType: 'BAND', targetId: bandId }, client);

      return { bandId, expiredAt: now.toISOString() };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 밴드를 삭제 처리한다. 유저용 밴드 삭제와 같이 deletedAt만 채우므로 복구할 수 있다.
   *
   * @param {AdminPrincipal} admin - 요청한 어드민
   * @param {string} bandId - 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<DeleteBandResult>} 삭제 시각
   */
  async deleteBand(admin: AdminPrincipal, bandId: string, tx?: Prisma.TransactionClient): Promise<DeleteBandResult> {
    const run = async (client: Prisma.TransactionClient): Promise<DeleteBandResult> => {
      const band = await this.findBand(bandId, client);
      if (band.deletedAt !== null) {
        throw new BadRequestException('이미 삭제된 밴드입니다.');
      }

      const deletedAt = new Date();
      await this.adminBandsRepository.updateBandDeletedAt(bandId, deletedAt, client);
      await this.auditLogsService.record({ adminUserId: admin.id, action: 'BAND_DELETE', targetType: 'BAND', targetId: bandId }, client);

      return { bandId, deletedAt: deletedAt.toISOString() };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 삭제된 밴드를 복구한다.
   *
   * @param {AdminPrincipal} admin - 요청한 어드민
   * @param {string} bandId - 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<RestoreBandResult>} 복구된 밴드 ID
   */
  async restoreBand(admin: AdminPrincipal, bandId: string, tx?: Prisma.TransactionClient): Promise<RestoreBandResult> {
    const run = async (client: Prisma.TransactionClient): Promise<RestoreBandResult> => {
      const band = await this.findBand(bandId, client);
      if (band.deletedAt === null) {
        throw new BadRequestException('삭제되지 않은 밴드입니다.');
      }

      await this.adminBandsRepository.updateBandDeletedAt(bandId, null, client);
      await this.auditLogsService.record({ adminUserId: admin.id, action: 'BAND_RESTORE', targetType: 'BAND', targetId: bandId }, client);

      return { bandId, deletedAt: null };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /** 삭제 여부와 상관없이 밴드를 찾고, 없으면 404를 던진다. */
  private async findBand(bandId: string, client: Prisma.TransactionClient): Promise<AdminBandState> {
    const band = await this.adminBandsRepository.findBandState(bandId, client);
    if (band === null) {
      throw new NotFoundException('밴드를 찾을 수 없습니다.');
    }

    return band;
  }

  /** 삭제되지 않은 밴드를 찾는다. 삭제된 밴드는 운영 작업 대상이 아니므로 없는 것과 같게 404로 본다. */
  private async findActiveBand(bandId: string, client: Prisma.TransactionClient): Promise<AdminBandState> {
    const band = await this.findBand(bandId, client);
    if (band.deletedAt !== null) {
      throw new NotFoundException('밴드를 찾을 수 없습니다.');
    }

    return band;
  }
}
