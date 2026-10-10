import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { PaginationParams } from 'src/common/pagination';
import { PrismaService } from 'src/database/prisma';
import type { BandMemberRole, Prisma } from 'src/generated/prisma';

import { toSkipTake } from '../../core/types/admin-paginated.type';
import type { AdminBandDetailRecord, AdminBandListFilter, AdminBandListItem, AdminBandMembership, AdminBandState } from '../types/admin-band.type';

import type { AdminBandsRepository } from './admin-bands.repository';

/** 밴드장·멤버 등 유저 표시용으로 함께 읽는 필드 */
const USER_SUMMARY_SELECT = {
  id: true,
  email: true,
  profile: { select: { nickname: true } },
} satisfies Prisma.UserSelect;

/**
 * 키워드로 밴드 검색 조건을 만든다.
 * uuid 컬럼에 UUID가 아닌 문자열을 비교하면 PostgreSQL이 오류를 내므로 UUID 형식일 때만 ID 일치 조건을 넣는다.
 *
 * @param {string} keyword - 검색어
 * @returns {Prisma.BandWhereInput} 밴드명 부분일치 또는 ID 일치 조건
 */
function buildBandKeywordWhere(keyword: string): Prisma.BandWhereInput {
  const conditions: Prisma.BandWhereInput[] = [{ name: { contains: keyword, mode: 'insensitive' } }];

  if (isUUID(keyword)) {
    conditions.push({ id: keyword });
  }

  return { OR: conditions };
}

@Injectable()
export class AdminBandsPrismaRepository implements AdminBandsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBands(
    filter: AdminBandListFilter,
    pagination: PaginationParams,
    tx?: Prisma.TransactionClient,
  ): Promise<{ items: AdminBandListItem[]; totalCount: number }> {
    const client = tx ?? this.prisma;
    const conditions: Prisma.BandWhereInput[] = [];

    if (!filter.includeDeleted) {
      conditions.push({ deletedAt: null });
    }
    if (filter.keyword !== undefined) {
      conditions.push(buildBandKeywordWhere(filter.keyword));
    }

    const where: Prisma.BandWhereInput = { AND: conditions };

    const [bands, totalCount] = await Promise.all([
      client.band.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...toSkipTake(pagination),
        select: {
          id: true,
          name: true,
          visibility: true,
          coverImgUrl: true,
          createdAt: true,
          deletedAt: true,
          bandMasterUser: { select: USER_SUMMARY_SELECT },
          _count: { select: { members: true } },
        },
      }),
      client.band.count({ where }),
    ]);

    const items = bands.map(band => ({
      bandId: band.id,
      name: band.name,
      visibility: band.visibility,
      coverImgUrl: band.coverImgUrl,
      bandMaster: {
        userId: band.bandMasterUser.id,
        nickname: band.bandMasterUser.profile?.nickname ?? null,
        email: band.bandMasterUser.email,
      },
      memberCount: band._count.members,
      createdAt: band.createdAt.toISOString(),
      deletedAt: band.deletedAt?.toISOString() ?? null,
    }));

    return { items, totalCount };
  }

  async findBandDetail(bandId: string, tx?: Prisma.TransactionClient): Promise<AdminBandDetailRecord | null> {
    const client = tx ?? this.prisma;

    const [band, scheduleCount] = await Promise.all([
      client.band.findUnique({
        where: { id: bandId },
        select: {
          id: true,
          name: true,
          description: true,
          visibility: true,
          coverImgUrl: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          bandGenres: {
            orderBy: [{ genre: { sortOrder: 'asc' } }, { genre: { name: 'asc' } }],
            select: { genre: { select: { id: true, name: true } } },
          },
          bandMasterUser: { select: USER_SUMMARY_SELECT },
          members: {
            orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
            select: { id: true, role: true, joinedAt: true, user: { select: USER_SUMMARY_SELECT } },
          },
          // 어드민은 삭제된 스페이스도 확인해야 하므로 deletedAt 조건을 두지 않는다.
          bandSpaces: {
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            select: {
              id: true,
              name: true,
              spaceType: true,
              status: true,
              createdAt: true,
              deletedAt: true,
              _count: { select: { members: true } },
            },
          },
          joinRequests: {
            where: { status: 'PENDING' },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: { id: true, userId: true, createdAt: true, user: { select: { profile: { select: { nickname: true } } } } },
          },
          invitations: {
            where: { status: 'PENDING' },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: { id: true, inviteeUserId: true, createdAt: true, inviteeUser: { select: { profile: { select: { nickname: true } } } } },
          },
          inviteLinks: { select: { expiredAt: true } },
          _count: { select: { songs: true, teams: true, places: true } },
        },
      }),
      // 일정은 밴드가 아니라 밴드 스페이스에 속하므로 스페이스를 거쳐 센다.
      client.schedule.count({ where: { bandSpace: { bandId } } }),
    ]);

    if (band === null) {
      return null;
    }

    // band_invite_link는 band_id 유니크라 밴드당 최대 1개다.
    const inviteLink = band.inviteLinks[0] ?? null;

    return {
      bandId: band.id,
      name: band.name,
      description: band.description,
      visibility: band.visibility,
      coverImgUrl: band.coverImgUrl,
      createdAt: band.createdAt.toISOString(),
      updatedAt: band.updatedAt.toISOString(),
      deletedAt: band.deletedAt?.toISOString() ?? null,
      genres: band.bandGenres.map(bandGenre => ({ genreId: bandGenre.genre.id, name: bandGenre.genre.name })),
      bandMaster: {
        userId: band.bandMasterUser.id,
        nickname: band.bandMasterUser.profile?.nickname ?? null,
        email: band.bandMasterUser.email,
      },
      members: band.members.map(member => ({
        bandMemberId: member.id,
        userId: member.user.id,
        nickname: member.user.profile?.nickname ?? null,
        email: member.user.email,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
      })),
      bandSpaces: band.bandSpaces.map(bandSpace => ({
        bandSpaceId: bandSpace.id,
        name: bandSpace.name,
        spaceType: bandSpace.spaceType,
        status: bandSpace.status,
        memberCount: bandSpace._count.members,
        createdAt: bandSpace.createdAt.toISOString(),
        deletedAt: bandSpace.deletedAt?.toISOString() ?? null,
      })),
      pendingJoinRequests: band.joinRequests.map(joinRequest => ({
        requestId: joinRequest.id,
        userId: joinRequest.userId,
        nickname: joinRequest.user.profile?.nickname ?? null,
        createdAt: joinRequest.createdAt.toISOString(),
      })),
      pendingInvitations: band.invitations.map(invitation => ({
        invitationId: invitation.id,
        inviteeUserId: invitation.inviteeUserId,
        inviteeNickname: invitation.inviteeUser.profile?.nickname ?? null,
        createdAt: invitation.createdAt.toISOString(),
      })),
      inviteLinkExpiredAt: inviteLink?.expiredAt ?? null,
      counts: {
        songs: band._count.songs,
        schedules: scheduleCount,
        teams: band._count.teams,
        places: band._count.places,
      },
    };
  }

  async findBandState(bandId: string, tx?: Prisma.TransactionClient): Promise<AdminBandState | null> {
    const client = tx ?? this.prisma;
    return client.band.findUnique({
      where: { id: bandId },
      select: { id: true, bandMasterUserId: true, deletedAt: true },
    });
  }

  async findBandMembership(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<AdminBandMembership | null> {
    const client = tx ?? this.prisma;
    const membership = await client.bandMember.findUnique({
      where: { bandId_userId: { bandId, userId } },
      select: { id: true, userId: true, role: true, user: { select: { deletedAt: true } } },
    });
    if (membership === null) {
      return null;
    }

    return { id: membership.id, userId: membership.userId, role: membership.role, isUserDeleted: membership.user.deletedAt !== null };
  }

  async updateBandMemberRole(bandMemberId: string, role: BandMemberRole, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.bandMember.update({ where: { id: bandMemberId }, data: { role } });
  }

  async updateBandMaster(bandId: string, bandMasterUserId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.band.update({ where: { id: bandId }, data: { bandMasterUserId } });
  }

  async findBandInviteLink(bandId: string, tx?: Prisma.TransactionClient): Promise<{ expiredAt: Date | null } | null> {
    const client = tx ?? this.prisma;
    return client.bandInviteLink.findUnique({ where: { bandId }, select: { expiredAt: true } });
  }

  async updateBandInviteLinkExpiredAt(bandId: string, expiredAt: Date, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.bandInviteLink.update({ where: { bandId }, data: { expiredAt } });
  }

  async updateBandDeletedAt(bandId: string, deletedAt: Date | null, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.band.update({ where: { id: bandId }, data: { deletedAt } });
  }
}
