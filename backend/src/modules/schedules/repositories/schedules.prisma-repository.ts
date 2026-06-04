import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { CreateScheduleInput } from '../dto/create-schedule.dto';
import type { CreateScheduleResult } from '../types/create-schedule-result.type';

import type { SchedulesRepository } from './schedules.repository';

@Injectable()
export class SchedulesPrismaRepository implements SchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSchedule(
    bandSpaceId: string,
    createdByBandMemberId: string,
    input: CreateScheduleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CreateScheduleResult> {
    const client = tx ?? this.prisma;

    const schedule = await client.schedule.create({
      data: {
        bandSpaceId,
        createdByBandMemberId,
        title: input.title,
        scheduleType: input.scheduleType,
        startAt: input.startAt ? new Date(input.startAt) : undefined,
        endAt: input.endAt ? new Date(input.endAt) : undefined,
        status: input.status,
        placeId: input.placeId ?? null,
        memo: input.memo ?? null,
      },
    });

    if (input.songIds && input.songIds.length > 0) {
      await client.scheduleSong.createMany({
        data: input.songIds.map(songId => ({ scheduleId: schedule.id, songId })),
      });
    }

    if (input.participantBandMemberIds && input.participantBandMemberIds.length > 0) {
      await client.scheduleParticipant.createMany({
        data: input.participantBandMemberIds.map(bandMemberId => ({
          scheduleId: schedule.id,
          bandMemberId,
        })),
      });
    }

    const songs =
      input.songIds && input.songIds.length > 0
        ? await client.song.findMany({
            where: { id: { in: input.songIds } },
            select: { id: true, title: true, artistName: true },
          })
        : [];

    const participantCount = input.participantBandMemberIds?.length ?? 0;

    return {
      scheduleId: schedule.id,
      spaceId: schedule.bandSpaceId,
      placeId: schedule.placeId,
      createdByBandMemberId: schedule.createdByBandMemberId,
      scheduleType: schedule.scheduleType,
      title: schedule.title,
      startAt: schedule.startAt?.toISOString() ?? null,
      endAt: schedule.endAt?.toISOString() ?? null,
      status: schedule.status,
      songs: songs.map(s => ({ songId: s.id, title: s.title, artistName: s.artistName })),
      participantCount,
      memo: schedule.memo,
      createdAt: schedule.createdAt.toISOString(),
    };
  }

  async findBandSpaceById(bandSpaceId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null> {
    const client = tx ?? this.prisma;
    return client.bandSpace.findFirst({
      where: { id: bandSpaceId, deletedAt: null },
      select: { id: true },
    });
  }

  async findSpaceMemberUserIds(bandSpaceId: string, tx?: Prisma.TransactionClient): Promise<string[]> {
    const client = tx ?? this.prisma;
    const members = await client.spaceMember.findMany({
      where: { bandSpaceId },
      include: { bandMember: { select: { userId: true } } },
    });
    return members.map(m => m.bandMember.userId);
  }
}
