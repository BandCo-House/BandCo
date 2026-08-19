import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type {
  BandInviteLinkAccessContext,
  BandInviteLinkItem,
  BandInviteLinkJoinContext,
  JoinedBandMember,
  UpsertBandInviteLinkInput,
} from '../types/band-invite-link.type';

import type { BandInviteLinksRepository } from './band-invite-links.repository';

@Injectable()
export class BandInviteLinksPrismaRepository implements BandInviteLinksRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 링크 관리 권한 판단에 필요한 활성 밴드와 요청자 멤버 정보를 조회한다.
   *
   * @param {string} bandId - 대상 밴드 ID
   * @param {string} userId - 인증된 사용자 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<BandInviteLinkAccessContext | null>} 활성 밴드와 요청자 멤버 정보
   */
  async findActiveBandWithRequesterMember(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<BandInviteLinkAccessContext | null> {
    const client = tx ?? this.prisma;

    const band = await client.band.findFirst({
      where: {
        id: bandId,
        deletedAt: null,
      },
      select: {
        id: true,
        members: {
          where: {
            userId,
          },
          select: {
            id: true,
            role: true,
          },
          take: 1,
        },
      },
    });

    if (band === null) {
      return null;
    }

    return {
      id: band.id,
      member: band.members[0] ?? null,
    };
  }

  /**
   * 밴드별 단일 링크 정책을 DB unique key 기반 upsert로 반영한다.
   *
   * @param {UpsertBandInviteLinkInput} input - 발급할 코드 해시와 만료 정보
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<BandInviteLinkItem>} 저장된 링크 정보
   */
  async upsertBandInviteLink(input: UpsertBandInviteLinkInput, tx?: Prisma.TransactionClient): Promise<BandInviteLinkItem> {
    const client = tx ?? this.prisma;

    const inviteLink = await client.bandInviteLink.upsert({
      where: {
        bandId: input.bandId,
      },
      update: {
        createBandMemberId: input.createBandMemberId,
        codeHash: input.codeHash,
        expiredAt: input.expiredAt,
      },
      create: {
        bandId: input.bandId,
        createBandMemberId: input.createBandMemberId,
        codeHash: input.codeHash,
        expiredAt: input.expiredAt,
      },
      select: {
        bandId: true,
        expiredAt: true,
      },
    });

    return {
      bandId: inviteLink.bandId,
      expiredAt: inviteLink.expiredAt ?? input.expiredAt,
    };
  }

  /**
   * 밴드의 초대 링크를 hard delete해 즉시 폐기한다.
   *
   * @param {string} bandId - 대상 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<boolean>} 삭제된 링크가 있으면 true
   */
  async deleteBandInviteLinkByBandId(bandId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const client = tx ?? this.prisma;

    const result = await client.bandInviteLink.deleteMany({
      where: {
        bandId,
      },
    });

    return result.count > 0;
  }

  /**
   * 코드 해시로 유효성 판단에 필요한 링크와 활성 밴드를 조회한다.
   *
   * @param {string} codeHash - 정규화한 코드의 SHA-256 해시
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<BandInviteLinkJoinContext | null>} 링크 가입 판단 정보
   */
  async findBandInviteLinkByCodeHash(codeHash: string, tx?: Prisma.TransactionClient): Promise<BandInviteLinkJoinContext | null> {
    const client = tx ?? this.prisma;

    return client.bandInviteLink.findFirst({
      where: {
        codeHash,
        band: {
          deletedAt: null,
        },
      },
      select: {
        bandId: true,
        expiredAt: true,
      },
    });
  }

  /**
   * 링크 가입 전 중복 멤버 여부를 조회한다.
   *
   * @param {string} bandId - 대상 밴드 ID
   * @param {string} userId - 가입할 사용자 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ id: string } | null>} 기존 멤버 정보
   */
  async findBandMemberByBandIdAndUserId(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
  } | null> {
    const client = tx ?? this.prisma;

    return client.bandMember.findFirst({
      where: {
        bandId,
        userId,
      },
      select: {
        id: true,
      },
    });
  }

  /**
   * 링크 가입 전 밴드 차단 여부를 조회한다.
   *
   * @param {string} bandId - 대상 밴드 ID
   * @param {string} userId - 가입할 사용자 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ id: string } | null>} 차단 정보
   */
  async findBandBlacklistByBandIdAndUserId(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
  } | null> {
    const client = tx ?? this.prisma;

    return client.bandBlacklist.findFirst({
      where: {
        bandId,
        userId,
      },
      select: {
        id: true,
      },
    });
  }

  /**
   * 링크로 가입한 사용자를 일반 밴드 멤버로 생성한다.
   *
   * @param {string} bandId - 가입할 밴드 ID
   * @param {string} userId - 가입할 사용자 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<JoinedBandMember>} 생성된 멤버 정보
   */
  async createBandMember(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<JoinedBandMember> {
    const client = tx ?? this.prisma;

    return client.bandMember.create({
      data: {
        bandId,
        userId,
        role: 'MEMBER',
      },
      select: {
        id: true,
        joinedAt: true,
      },
    });
  }

  /**
   * 링크 가입 후 더 이상 처리할 수 없는 대기 초대와 가입 요청을 제거한다.
   *
   * @param {string} bandId - 가입한 밴드 ID
   * @param {string} userId - 가입한 사용자 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<void>} 정리 완료
   */
  async deletePendingBandEntryRequests(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;

    await client.bandInvitation.deleteMany({
      where: {
        bandId,
        inviteeUserId: userId,
        status: 'PENDING',
      },
    });

    await client.bandJoinRequest.deleteMany({
      where: {
        bandId,
        userId,
        status: 'PENDING',
      },
    });
  }
}
