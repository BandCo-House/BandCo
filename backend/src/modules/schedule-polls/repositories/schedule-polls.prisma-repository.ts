import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma';
import type { BandMemberRole, Prisma } from '../../../generated/prisma';
import type { CreateSchedulePollInput } from '../dto/create-schedule-poll.dto';
import type { SchedulePollData, SchedulePollListItem, SchedulePollOptionData } from '../types/schedule-poll.type';

import type { SchedulePollsRepository } from './schedule-polls.repository';

type SchedulePollRow = Prisma.SchedulePollGetPayload<{
  include: {
    options: {
      include: {
        votes: {
          include: {
            bandMember: {
              include: {
                user: {
                  include: { profile: true };
                };
              };
            };
          };
        };
      };
    };
  };
}>;

@Injectable()
export class SchedulePollsPrismaRepository implements SchedulePollsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveBandSpaceById(bandSpaceId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null> {
    const client = tx ?? this.prisma;

    return client.bandSpace.findFirst({
      where: { id: bandSpaceId, deletedAt: null },
      select: { id: true },
    });
  }

  async findBandMemberByBandSpaceIdAndUserId(
    bandSpaceId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; role: BandMemberRole } | null> {
    const client = tx ?? this.prisma;

    return client.bandMember.findFirst({
      where: {
        userId,
        band: { bandSpaces: { some: { id: bandSpaceId, deletedAt: null } } },
      },
      select: { id: true, role: true },
    });
  }

  async lockBandMemberForVote(bandMemberId: string, tx: Prisma.TransactionClient): Promise<void> {
    // Prisma 쿼리 API에는 행 잠금이 없어 raw로 건다. 태그드 템플릿이라 bandMemberId는 파라미터로 바인딩된다.
    await tx.$queryRaw`SELECT id FROM band_members WHERE id = ${bandMemberId}::uuid FOR UPDATE`;
  }

  async createSchedulePoll(
    bandSpaceId: string,
    createdByBandMemberId: string,
    input: CreateSchedulePollInput,
    tx?: Prisma.TransactionClient,
  ): Promise<SchedulePollData> {
    const client = tx ?? this.prisma;
    const row = await client.schedulePoll.create({
      data: {
        bandSpaceId,
        createdByBandMemberId,
        name: input.name,
        closesAt: new Date(input.closesAt),
        options: {
          create: input.options.map(option => ({
            startAt: new Date(option.startAt),
            endAt: new Date(option.endAt),
          })),
        },
      },
      include: {
        options: {
          orderBy: [{ startAt: 'asc' }, { endAt: 'asc' }, { id: 'asc' }],
          include: {
            votes: {
              include: {
                bandMember: { include: { user: { include: { profile: true } } } },
              },
            },
          },
        },
      },
    });

    return this.mapSchedulePoll(row, createdByBandMemberId);
  }

  async findSchedulePollContextById(
    schedulePollId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ bandSpaceId: string; createdByBandMemberId: string | null; closesAt: Date } | null> {
    const client = tx ?? this.prisma;

    return client.schedulePoll.findFirst({
      where: { id: schedulePollId, bandSpace: { deletedAt: null } },
      select: { bandSpaceId: true, createdByBandMemberId: true, closesAt: true },
    });
  }

  async findSchedulePollById(schedulePollId: string, currentBandMemberId: string, tx?: Prisma.TransactionClient): Promise<SchedulePollData | null> {
    const client = tx ?? this.prisma;
    const row = await client.schedulePoll.findFirst({
      where: { id: schedulePollId, bandSpace: { deletedAt: null } },
      include: {
        options: {
          orderBy: [{ startAt: 'asc' }, { endAt: 'asc' }, { id: 'asc' }],
          include: {
            votes: {
              orderBy: { createdAt: 'asc' },
              include: {
                bandMember: { include: { user: { include: { profile: true } } } },
              },
            },
          },
        },
      },
    });

    if (row === null) {
      return null;
    }

    return this.mapSchedulePoll(row, currentBandMemberId);
  }

  async findSchedulePollsByBandSpaceId(
    bandSpaceId: string,
    currentBandMemberId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SchedulePollListItem[]> {
    const client = tx ?? this.prisma;
    const rows = await client.schedulePoll.findMany({
      where: { bandSpaceId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        options: {
          orderBy: [{ startAt: 'asc' }, { endAt: 'asc' }, { id: 'asc' }],
          select: { startAt: true, votes: { select: { bandMemberId: true } } },
        },
      },
    });

    return rows.map(row => {
      // 한 멤버가 여러 후보를 골라도 투표자는 한 명으로 센다.
      const voterIds = new Set(row.options.flatMap(option => option.votes.map(vote => vote.bandMemberId)));

      return {
        schedulePollId: row.id,
        bandSpaceId: row.bandSpaceId,
        createdByBandMemberId: row.createdByBandMemberId,
        name: row.name,
        closesAt: row.closesAt.toISOString(),
        optionStartAts: row.options.map(option => option.startAt.toISOString()),
        optionCount: row.options.length,
        voterCount: voterIds.size,
        hasVoted: voterIds.has(currentBandMemberId),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    });
  }

  async countSchedulePollOptionsByIds(schedulePollId: string, optionIds: string[], tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;

    return client.schedulePollOption.count({
      where: { schedulePollId, id: { in: optionIds } },
    });
  }

  async replaceSchedulePollVotes(schedulePollId: string, bandMemberId: string, optionIds: string[], tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;

    await client.schedulePollVote.deleteMany({
      where: {
        bandMemberId,
        schedulePollOption: { schedulePollId },
      },
    });

    if (optionIds.length === 0) {
      return;
    }

    await client.schedulePollVote.createMany({
      data: optionIds.map(schedulePollOptionId => ({
        schedulePollOptionId,
        bandMemberId,
      })),
    });
  }

  async deleteSchedulePoll(schedulePollId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;

    await client.schedulePoll.delete({ where: { id: schedulePollId } });
  }

  private mapSchedulePoll(row: SchedulePollRow, currentBandMemberId: string): SchedulePollData {
    const options = row.options.map(
      (option): SchedulePollOptionData => ({
        schedulePollOptionId: option.id,
        startAt: option.startAt.toISOString(),
        endAt: option.endAt.toISOString(),
        voters: option.votes.map(vote => ({
          bandMemberId: vote.bandMemberId,
          userId: vote.bandMember.userId,
          nickname: vote.bandMember.user.profile?.nickname ?? '',
          avatarUrl: vote.bandMember.user.profile?.avatarUrl ?? null,
        })),
      }),
    );

    const myOptionIds = row.options.filter(option => option.votes.some(vote => vote.bandMemberId === currentBandMemberId)).map(option => option.id);

    return {
      schedulePollId: row.id,
      bandSpaceId: row.bandSpaceId,
      createdByBandMemberId: row.createdByBandMemberId,
      name: row.name,
      closesAt: row.closesAt.toISOString(),
      options,
      myOptionIds,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
