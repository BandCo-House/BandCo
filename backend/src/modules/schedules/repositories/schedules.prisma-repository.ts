import { Injectable } from '@nestjs/common';

import { buildNextPath } from '../../../common/url';
import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { CreateScheduleInput } from '../dto/create-schedule.dto';
import type { GetSchedulesQuery } from '../dto/get-schedules-query.dto';
import type { UpdateScheduleInput } from '../dto/update-schedule.dto';
import type { BandScheduleListItem, GetBandSchedulesResult } from '../types/band-schedule-list-item.type';
import type { CreateScheduleResult, ScheduleSongItem } from '../types/create-schedule-result.type';
import type { GetScheduleDetailResult } from '../types/schedule-detail.type';
import type { GetSpaceSchedulesResult, ScheduleListMeta } from '../types/schedule-list-item.type';
import type { UpdateScheduleResult } from '../types/update-schedule-result.type';

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

    const songIds = [...new Set(input.songIds ?? [])];
    const participantBandMemberIds = [...new Set(input.participantBandMemberIds ?? [])];

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

    if (songIds.length > 0) {
      await client.scheduleSong.createMany({
        data: songIds.map(songId => ({ scheduleId: schedule.id, songId })),
      });
    }

    if (participantBandMemberIds.length > 0) {
      await client.scheduleParticipant.createMany({
        data: participantBandMemberIds.map(bandMemberId => ({
          scheduleId: schedule.id,
          bandMemberId,
        })),
      });
    }

    const songs =
      songIds.length > 0
        ? await client.song.findMany({
            where: { id: { in: songIds } },
            select: { id: true, title: true, artistName: true },
          })
        : [];

    const participantCount = participantBandMemberIds.length;

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

  async findScheduleById(scheduleId: string, userId?: string, tx?: Prisma.TransactionClient): Promise<GetScheduleDetailResult | undefined> {
    const client = tx ?? this.prisma;

    const row = await client.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        place: { select: { id: true, name: true, address: true } },
        scheduleSongs: { include: { song: { select: { id: true, title: true, artistName: true } } } },
        createdByBandMember: { select: { userId: true } },
        participants: {
          select: {
            id: true,
            bandMemberId: true,
            attendanceStatus: true,
            note: true,
            bandMember: {
              select: {
                userId: true,
                user: { select: { profile: { select: { nickname: true, avatarUrl: true } } } },
              },
            },
          },
        },
      },
    });

    if (!row) return undefined;

    // 로그인 사용자가 생성자이거나 참여자이면 본인과 연관된 일정으로 본다.
    const isMine = userId !== undefined && (row.createdByBandMember.userId === userId || row.participants.some(p => p.bandMember.userId === userId));

    return {
      schedule: {
        scheduleId: row.id,
        spaceId: row.bandSpaceId,
        scheduleType: row.scheduleType,
        title: row.title,
        startAt: row.startAt?.toISOString() ?? null,
        endAt: row.endAt?.toISOString() ?? null,
        status: row.status,
        place: row.place ? { placeId: row.place.id, name: row.place.name, address: row.place.address } : null,
        songs: row.scheduleSongs.map(ss => ({ songId: ss.song.id, title: ss.song.title, artistName: ss.song.artistName }) as ScheduleSongItem),
        participants: row.participants.map(p => ({
          participantId: p.id,
          bandMemberId: p.bandMemberId,
          userId: p.bandMember.userId,
          nickname: p.bandMember.user.profile?.nickname ?? '',
          avatarUrl: p.bandMember.user.profile?.avatarUrl ?? null,
          attendanceStatus: p.attendanceStatus ?? null,
          note: p.note ?? null,
        })),
        memo: row.memo,
        createdByBandMemberId: row.createdByBandMemberId,
        isMine,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    };
  }

  async updateSchedule(scheduleId: string, input: UpdateScheduleInput, tx?: Prisma.TransactionClient): Promise<UpdateScheduleResult> {
    const client = tx ?? this.prisma;

    const updated = await client.schedule.update({
      where: { id: scheduleId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.scheduleType !== undefined && { scheduleType: input.scheduleType }),
        ...(input.startAt !== undefined && { startAt: new Date(input.startAt) }),
        ...(input.endAt !== undefined && { endAt: new Date(input.endAt) }),
        ...(input.placeId !== undefined && { placeId: input.placeId }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.memo !== undefined && { memo: input.memo }),
      },
    });

    if (input.songIds !== undefined) {
      await client.scheduleSong.deleteMany({ where: { scheduleId } });
      if (input.songIds.length > 0) {
        await client.scheduleSong.createMany({
          data: input.songIds.map(songId => ({ scheduleId, songId })),
        });
      }
    }

    if (input.participantBandMemberIds !== undefined) {
      await client.scheduleParticipant.deleteMany({ where: { scheduleId } });
      if (input.participantBandMemberIds.length > 0) {
        await client.scheduleParticipant.createMany({
          data: input.participantBandMemberIds.map(bandMemberId => ({ scheduleId, bandMemberId })),
        });
      }
    }

    const songIds =
      input.songIds !== undefined
        ? input.songIds
        : (await client.scheduleSong.findMany({ where: { scheduleId }, select: { songId: true } })).map(s => s.songId);

    const participantCount = await client.scheduleParticipant.count({ where: { scheduleId } });

    return {
      scheduleId: updated.id,
      spaceId: updated.bandSpaceId,
      scheduleType: updated.scheduleType,
      title: updated.title,
      startAt: updated.startAt?.toISOString() ?? null,
      endAt: updated.endAt?.toISOString() ?? null,
      placeId: updated.placeId,
      status: updated.status,
      songIds,
      participantCount,
      memo: updated.memo,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteSchedule(scheduleId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.schedule.delete({ where: { id: scheduleId } });
  }

  async findBandMemberByBandSpaceIdAndUserId(bandSpaceId: string, userId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null> {
    const client = tx ?? this.prisma;
    return client.bandMember.findFirst({
      where: {
        userId,
        band: { bandSpaces: { some: { id: bandSpaceId, deletedAt: null } } },
      },
      select: { id: true },
    });
  }

  async findBandById(bandId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null> {
    const client = tx ?? this.prisma;
    return client.band.findFirst({
      where: { id: bandId, deletedAt: null },
      select: { id: true },
    });
  }

  async findSchedulesByBandId(
    bandId: string,
    query: GetSchedulesQuery,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<GetBandSchedulesResult> {
    const client = tx ?? this.prisma;
    const take = query.take ?? 50;

    const where: Prisma.ScheduleWhereInput = {
      bandSpace: { bandId, deletedAt: null },
      ...(query.where__start_at__greater_than_equal && { startAt: { gte: new Date(query.where__start_at__greater_than_equal) } }),
      ...(query.where__start_at__less_than_equal && {
        startAt: {
          ...(query.where__start_at__greater_than_equal && { gte: new Date(query.where__start_at__greater_than_equal) }),
          lte: new Date(query.where__start_at__less_than_equal),
        },
      }),
      ...(query.where__place_id && { placeId: query.where__place_id }),
      ...(query.where__schedule_type && { scheduleType: query.where__schedule_type }),
      ...(query.where__status && { status: query.where__status }),
      ...(query.cursor__start_at &&
        query.cursor__id && {
          OR: [{ startAt: { gt: new Date(query.cursor__start_at) } }, { startAt: new Date(query.cursor__start_at), id: { gt: query.cursor__id } }],
        }),
    };

    const rows = await client.schedule.findMany({
      where,
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
      take: take + 1,
      include: {
        bandSpace: { select: { id: true, name: true } },
        createdByBandMember: { select: { userId: true } },
        participants: { where: { bandMember: { userId } }, select: { id: true }, take: 1 },
      },
    });

    const hasNext = rows.length > take;
    const items = hasNext ? rows.slice(0, take) : rows;
    const lastItem = items[items.length - 1];

    const meta: ScheduleListMeta = {
      count: items.length,
      take,
      cursor: lastItem?.startAt ? { startAt: lastItem.startAt.toISOString(), id: lastItem.id } : null,
      next: hasNext && lastItem?.startAt ? buildNextPath('', { cursor__start_at: lastItem.startAt.toISOString(), cursor__id: lastItem.id }) : null,
    };

    return {
      items: items.map(
        (row): BandScheduleListItem => ({
          scheduleId: row.id,
          spaceId: row.bandSpaceId,
          space: { spaceId: row.bandSpace.id, name: row.bandSpace.name },
          scheduleType: row.scheduleType,
          title: row.title,
          startAt: row.startAt?.toISOString() ?? null,
          endAt: row.endAt?.toISOString() ?? null,
          status: row.status,
          isMine: row.createdByBandMember.userId === userId || row.participants.length > 0,
        }),
      ),
      meta,
    };
  }

  async findSchedulesBySpaceId(
    bandSpaceId: string,
    query: GetSchedulesQuery,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<GetSpaceSchedulesResult> {
    const client = tx ?? this.prisma;
    const take = query.take ?? 50;

    const where: Prisma.ScheduleWhereInput = {
      bandSpaceId,
      ...(query.where__start_at__greater_than_equal && { startAt: { gte: new Date(query.where__start_at__greater_than_equal) } }),
      ...(query.where__start_at__less_than_equal && {
        startAt: {
          ...(query.where__start_at__greater_than_equal && { gte: new Date(query.where__start_at__greater_than_equal) }),
          lte: new Date(query.where__start_at__less_than_equal),
        },
      }),
      ...(query.where__place_id && { placeId: query.where__place_id }),
      ...(query.where__schedule_type && { scheduleType: query.where__schedule_type }),
      ...(query.where__status && { status: query.where__status }),
      ...(query.cursor__start_at &&
        query.cursor__id && {
          OR: [{ startAt: { gt: new Date(query.cursor__start_at) } }, { startAt: new Date(query.cursor__start_at), id: { gt: query.cursor__id } }],
        }),
    };

    const rows = await client.schedule.findMany({
      where,
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
      take: take + 1,
      include: {
        place: { select: { id: true, name: true } },
        scheduleSongs: { include: { song: { select: { id: true, title: true, artistName: true } } } },
        createdByBandMember: { select: { userId: true } },
        participants: {
          select: {
            bandMember: {
              select: {
                userId: true,
                user: { select: { profile: { select: { avatarUrl: true } } } },
              },
            },
          },
        },
      },
    });

    const hasNext = rows.length > take;
    const items = hasNext ? rows.slice(0, take) : rows;
    const lastItem = items[items.length - 1];

    const meta: ScheduleListMeta = {
      count: items.length,
      take,
      cursor: lastItem?.startAt ? { startAt: lastItem.startAt.toISOString(), id: lastItem.id } : null,
      next: hasNext && lastItem?.startAt ? buildNextPath('', { cursor__start_at: lastItem.startAt.toISOString(), cursor__id: lastItem.id }) : null,
    };

    return {
      items: items.map(row => ({
        scheduleId: row.id,
        spaceId: row.bandSpaceId,
        scheduleType: row.scheduleType,
        title: row.title,
        startAt: row.startAt?.toISOString() ?? null,
        endAt: row.endAt?.toISOString() ?? null,
        place: row.place ? { placeId: row.place.id, name: row.place.name } : null,
        songs: row.scheduleSongs.map(ss => ({ songId: ss.song.id, title: ss.song.title, artistName: ss.song.artistName })),
        participantCount: row.participants.length,
        participants: row.participants.map(p => ({
          userId: p.bandMember.userId,
          avatarUrl: p.bandMember.user.profile?.avatarUrl ?? null,
        })),
        memo: row.memo,
        status: row.status,
        isMine: row.createdByBandMember.userId === userId || row.participants.some(p => p.bandMember.userId === userId),
      })),
      meta,
    };
  }
}
