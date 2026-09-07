import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma';
import { BandSpaceMemberStatus, type Prisma } from '../../../generated/prisma';
import type { CreateSchedulePollInput } from '../dto/create-schedule-poll.dto';
import type { SchedulePollData, SchedulePollOptionData } from '../types/schedule-poll.type';

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

  async findActiveSpaceMemberByUserId(bandSpaceId: string, userId: string, tx?: Prisma.TransactionClient): Promise<{ bandMemberId: string } | null> {
    const client = tx ?? this.prisma;
    const spaceMember = await client.spaceMember.findFirst({
      where: {
        bandSpaceId,
        status: BandSpaceMemberStatus.ACTIVE,
        bandMember: { userId },
      },
      select: { bandMemberId: true },
    });

    return spaceMember;
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

  async findSchedulePollContextById(schedulePollId: string, tx?: Prisma.TransactionClient): Promise<{ bandSpaceId: string } | null> {
    const client = tx ?? this.prisma;

    return client.schedulePoll.findFirst({
      where: { id: schedulePollId, bandSpace: { deletedAt: null } },
      select: { bandSpaceId: true },
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
      options,
      myOptionIds,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
