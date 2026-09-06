import { Injectable } from '@nestjs/common';

import { buildNextPath } from '../../../common/url';
import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { CreateScheduleInput } from '../dto/create-schedule.dto';
import type { GetSchedulesQuery } from '../dto/get-schedules-query.dto';
import type { ScheduleParticipantInput } from '../dto/schedule-participant.dto';
import type { UpdateScheduleInput } from '../dto/update-schedule.dto';
import type { BandScheduleListItem, GetBandSchedulesResult } from '../types/band-schedule-list-item.type';
import type { CreateScheduleResult, ScheduleSongItem } from '../types/create-schedule-result.type';
import type { GetScheduleDetailResult } from '../types/schedule-detail.type';
import type { GetSpaceSchedulesResult, ScheduleListMeta } from '../types/schedule-list-item.type';
import type { ScheduleReferenceFileItem } from '../types/schedule-reference-file.type';
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
    const participants = this.dedupeParticipants(input.participants ?? []);

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
        externalLinks: input.externalLinks,
      },
    });

    if (songIds.length > 0) {
      await client.scheduleSong.createMany({
        data: songIds.map(songId => ({ scheduleId: schedule.id, songId })),
      });
    }

    if (participants.length > 0) {
      await client.scheduleParticipant.createMany({
        data: participants.map(participant => ({
          scheduleId: schedule.id,
          bandMemberId: participant.bandMemberId,
          skillTypeId: participant.skillTypeId ?? null,
        })),
      });
    }

    if (input.teamId) {
      await client.scheduleTeam.create({
        data: { scheduleId: schedule.id, teamId: input.teamId },
      });
    }

    if (input.referenceFiles !== undefined && input.referenceFiles.length > 0) {
      await client.scheduleReferenceFile.createMany({
        data: input.referenceFiles.map(referenceFile => ({
          scheduleId: schedule.id,
          fileUrl: referenceFile.fileUrl,
          fileName: referenceFile.fileName,
        })),
      });
    }

    const songs =
      songIds.length > 0
        ? await client.song.findMany({
            where: { id: { in: songIds } },
            select: { id: true, title: true, artistName: true, key: true },
          })
        : [];

    // 한 사람이 여러 세션을 맡으면 행이 여러 개가 되므로 사람 수는 중복을 뺀 값이다.
    const participantCount = new Set(participants.map(participant => participant.bandMemberId)).size;

    const referenceFiles = await client.scheduleReferenceFile.findMany({
      where: { scheduleId: schedule.id },
      orderBy: { createdAt: 'asc' },
    });

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
      songs: songs.map(s => ({ songId: s.id, title: s.title, artistName: s.artistName, key: s.key ?? null })),
      participantCount,
      teamId: input.teamId ?? null,
      memo: schedule.memo,
      externalLinks: schedule.externalLinks,
      referenceFiles: this.mapReferenceFiles(referenceFiles),
      createdAt: schedule.createdAt.toISOString(),
    };
  }

  /**
   * (밴드 멤버, 세션) 조합 기준으로 중복을 제거한다.
   * 같은 사람을 같은 세션에 두 번 넣는 건 사용자 실수라 에러 대신 하나로 접는다.
   *
   * @param {ScheduleParticipantInput[]} participants - 정규화된 참여자 목록
   * @returns {ScheduleParticipantInput[]} 중복이 제거된 목록(입력 순서 유지)
   */
  private dedupeParticipants(participants: ScheduleParticipantInput[]): ScheduleParticipantInput[] {
    const seen = new Set<string>();
    return participants.filter(participant => {
      const key = `${participant.bandMemberId}|${participant.skillTypeId ?? ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async findExistingSkillTypeIds(skillTypeIds: string[], tx?: Prisma.TransactionClient): Promise<string[]> {
    const client = tx ?? this.prisma;
    if (skillTypeIds.length === 0) return [];
    const rows = await client.skillType.findMany({
      where: { id: { in: skillTypeIds } },
      select: { id: true },
    });
    return rows.map(row => row.id);
  }

  async findTeamInSameBandAsSpace(teamId: string, bandSpaceId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null> {
    const client = tx ?? this.prisma;
    return client.team.findFirst({
      where: { id: teamId, band: { bandSpaces: { some: { id: bandSpaceId } } } },
      select: { id: true },
    });
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
        scheduleSongs: { include: { song: { select: { id: true, title: true, artistName: true, key: true } } } },
        createdByBandMember: { select: { userId: true } },
        participants: {
          select: {
            id: true,
            bandMemberId: true,
            attendanceStatus: true,
            note: true,
            skillType: { select: { id: true, name: true } },
            bandMember: {
              select: {
                userId: true,
                user: { select: { profile: { select: { nickname: true, avatarUrl: true } } } },
              },
            },
          },
        },
        referenceFiles: { orderBy: { createdAt: 'asc' } },
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
        songs: row.scheduleSongs.map(
          ss => ({ songId: ss.song.id, title: ss.song.title, artistName: ss.song.artistName, key: ss.song.key ?? null }) as ScheduleSongItem,
        ),
        participants: row.participants.map(p => ({
          participantId: p.id,
          bandMemberId: p.bandMemberId,
          userId: p.bandMember.userId,
          nickname: p.bandMember.user.profile?.nickname ?? '',
          avatarUrl: p.bandMember.user.profile?.avatarUrl ?? null,
          attendanceStatus: p.attendanceStatus ?? null,
          note: p.note ?? null,
          skillType: p.skillType ? { skillTypeId: p.skillType.id, name: p.skillType.name } : null,
        })),
        memo: row.memo,
        externalLinks: row.externalLinks,
        referenceFiles: this.mapReferenceFiles(row.referenceFiles),
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
        ...(input.externalLinks !== undefined && { externalLinks: { set: input.externalLinks } }),
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

    if (input.participants !== undefined) {
      const participants = this.dedupeParticipants(input.participants);
      await client.scheduleParticipant.deleteMany({ where: { scheduleId } });
      if (participants.length > 0) {
        await client.scheduleParticipant.createMany({
          data: participants.map(participant => ({
            scheduleId,
            bandMemberId: participant.bandMemberId,
            skillTypeId: participant.skillTypeId ?? null,
          })),
        });
      }
    } else if (updated.scheduleType === 'MEETING') {
      // 참여자를 그대로 두고 합주 → 회의로만 바꾼 경우. 세션이 붙은 행이 남으면
      // 회의인데 세션 편성이 있는 상태가 되므로 여기서 정리한다.
      await client.scheduleParticipant.updateMany({
        where: { scheduleId, skillTypeId: { not: null } },
        data: { skillTypeId: null },
      });
    }

    if (input.referenceFiles !== undefined) {
      await client.scheduleReferenceFile.deleteMany({ where: { scheduleId } });
      if (input.referenceFiles.length > 0) {
        await client.scheduleReferenceFile.createMany({
          data: input.referenceFiles.map(referenceFile => ({
            scheduleId,
            fileUrl: referenceFile.fileUrl,
            fileName: referenceFile.fileName,
          })),
        });
      }
    }

    const songIds =
      input.songIds !== undefined
        ? input.songIds
        : (await client.scheduleSong.findMany({ where: { scheduleId }, select: { songId: true } })).map(s => s.songId);

    // 세션마다 행이 나뉘므로 distinct로 사람 수를 센다.
    const participantRows = await client.scheduleParticipant.findMany({ where: { scheduleId }, select: { bandMemberId: true } });
    const participantCount = new Set(participantRows.map(row => row.bandMemberId)).size;

    const referenceFiles = await client.scheduleReferenceFile.findMany({
      where: { scheduleId },
      orderBy: { createdAt: 'asc' },
    });

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
      externalLinks: updated.externalLinks,
      referenceFiles: this.mapReferenceFiles(referenceFiles),
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

  /**
   * 일정 목록 조회의 AND 결합 조건을 만든다.
   * cursor 기반 keyset 조건과 "내가 포함된 일정만"(where__is_mine) 조건을 함께 담아
   * 최상위 OR 키 충돌 없이 결합한다.
   */
  private buildScheduleListAndConditions(query: GetSchedulesQuery, userId: string): Prisma.ScheduleWhereInput[] {
    const and: Prisma.ScheduleWhereInput[] = [];

    if (query.cursor__start_at && query.cursor__id) {
      and.push({
        OR: [{ startAt: { gt: new Date(query.cursor__start_at) } }, { startAt: new Date(query.cursor__start_at), id: { gt: query.cursor__id } }],
      });
    }

    // 생성자이거나 참여자이면 본인과 연관된 일정으로 본다. isMine 플래그와 판정 기준이 같다.
    if (query.where__is_mine) {
      and.push({
        OR: [{ createdByBandMember: { userId } }, { participants: { some: { bandMember: { userId } } } }],
      });
    }

    return and;
  }

  async findSchedulesByBandId(
    bandId: string,
    query: GetSchedulesQuery,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<GetBandSchedulesResult> {
    const client = tx ?? this.prisma;
    const take = query.take ?? 50;
    const and = this.buildScheduleListAndConditions(query, userId);

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
      ...(and.length > 0 ? { AND: and } : {}),
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
    const and = this.buildScheduleListAndConditions(query, userId);

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
      ...(query.where__team_id && { scheduleTeams: { some: { teamId: query.where__team_id } } }),
      ...(query.where__schedule_type && { scheduleType: query.where__schedule_type }),
      ...(query.where__status && { status: query.where__status }),
      ...(and.length > 0 ? { AND: and } : {}),
    };

    const rows = await client.schedule.findMany({
      where,
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
      take: take + 1,
      include: {
        place: { select: { id: true, name: true } },
        scheduleTeams: { select: { team: { select: { id: true, name: true } } }, take: 1 },
        scheduleSongs: { include: { song: { select: { id: true, title: true, artistName: true, key: true } } } },
        createdByBandMember: { select: { userId: true } },
        participants: {
          select: {
            bandMemberId: true,
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
        team: row.scheduleTeams[0] ? { teamId: row.scheduleTeams[0].team.id, name: row.scheduleTeams[0].team.name } : null,
        songs: row.scheduleSongs.map(ss => ({ songId: ss.song.id, title: ss.song.title, artistName: ss.song.artistName, key: ss.song.key ?? null })),
        participantCount: row.participants.length,
        participants: row.participants.map(p => ({
          bandMemberId: p.bandMemberId,
          nickname: p.bandMember.user.profile?.nickname ?? '',
          profileImageUrl: p.bandMember.user.profile?.avatarUrl ?? null,
        })),
        memo: row.memo,
        status: row.status,
        isMine: row.createdByBandMember.userId === userId || row.participants.some(p => p.bandMember.userId === userId),
      })),
      meta,
    };
  }

  private mapReferenceFiles(referenceFiles: { id: string; fileUrl: string; fileName: string; createdAt: Date }[]): ScheduleReferenceFileItem[] {
    return referenceFiles.map(referenceFile => ({
      id: referenceFile.id,
      fileUrl: referenceFile.fileUrl,
      fileName: referenceFile.fileName,
      createdAt: referenceFile.createdAt.toISOString(),
    }));
  }
}
