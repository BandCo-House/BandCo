import type { PrismaService } from '../../../database/prisma';
import { ScheduleStatus, ScheduleType } from '../../../generated/prisma';

import { SchedulesPrismaRepository } from './schedules.prisma-repository';

const SCHEDULE_ID = '11111111-1111-4111-8111-111111111111';
const BAND_SPACE_ID = '22222222-2222-4222-8222-222222222222';
const BAND_MEMBER_ID = '33333333-3333-4333-8333-333333333333';
const CREATED_AT = new Date('2026-08-11T00:00:00.000Z');

const createPrismaMock = () => ({
  schedule: {
    create: jest.fn(),
    update: jest.fn(),
  },
  scheduleSong: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
  scheduleParticipant: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  scheduleTeam: {
    create: jest.fn(),
  },
  scheduleReferenceFile: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
  song: {
    findMany: jest.fn(),
  },
});

const scheduleRow = {
  id: SCHEDULE_ID,
  bandSpaceId: BAND_SPACE_ID,
  placeId: null,
  createdByBandMemberId: BAND_MEMBER_ID,
  scheduleType: ScheduleType.PRACTICE,
  title: '정기 합주',
  startAt: new Date('2026-08-12T10:00:00.000Z'),
  endAt: new Date('2026-08-12T12:00:00.000Z'),
  status: ScheduleStatus.PLANNED,
  memo: null,
  externalLinks: ['https://example.com/notice'],
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
};

describe('SchedulesPrismaRepository', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let repository: SchedulesPrismaRepository;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new SchedulesPrismaRepository(prisma as unknown as PrismaService);
  });

  it('일정 생성 시 외부 링크와 참고자료를 함께 저장해 반환한다', async () => {
    prisma.schedule.create.mockResolvedValue(scheduleRow);
    prisma.scheduleReferenceFile.findMany.mockResolvedValue([
      {
        id: 'reference-file-id',
        scheduleId: SCHEDULE_ID,
        fileUrl: 'https://storage.example.com/reference.pdf',
        fileName: '합주 공지.pdf',
        createdAt: CREATED_AT,
      },
    ]);

    const result = await repository.createSchedule(BAND_SPACE_ID, BAND_MEMBER_ID, {
      title: '정기 합주',
      scheduleType: ScheduleType.PRACTICE,
      startAt: '2026-08-12T10:00:00.000Z',
      endAt: '2026-08-12T12:00:00.000Z',
      status: ScheduleStatus.PLANNED,
      externalLinks: ['https://example.com/notice'],
      referenceFiles: [{ fileUrl: 'https://storage.example.com/reference.pdf', fileName: '합주 공지.pdf' }],
    });

    expect(prisma.schedule.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ externalLinks: ['https://example.com/notice'] }) }),
    );
    expect(prisma.scheduleReferenceFile.createMany).toHaveBeenCalledWith({
      data: [
        {
          scheduleId: SCHEDULE_ID,
          fileUrl: 'https://storage.example.com/reference.pdf',
          fileName: '합주 공지.pdf',
        },
      ],
    });
    expect(result.externalLinks).toEqual(['https://example.com/notice']);
    expect(result.referenceFiles).toEqual([
      {
        id: 'reference-file-id',
        fileUrl: 'https://storage.example.com/reference.pdf',
        fileName: '합주 공지.pdf',
        createdAt: CREATED_AT.toISOString(),
      },
    ]);
  });

  it('수정 요청에 빈 배열이 오면 외부 링크와 참고자료를 모두 비운다', async () => {
    prisma.schedule.update.mockResolvedValue({ ...scheduleRow, externalLinks: [] });
    prisma.scheduleParticipant.count.mockResolvedValue(0);
    prisma.scheduleReferenceFile.findMany.mockResolvedValue([]);

    const result = await repository.updateSchedule(SCHEDULE_ID, {
      songIds: [],
      participantBandMemberIds: [],
      externalLinks: [],
      referenceFiles: [],
    });

    expect(prisma.schedule.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ externalLinks: { set: [] } }) }));
    expect(prisma.scheduleReferenceFile.deleteMany).toHaveBeenCalledWith({ where: { scheduleId: SCHEDULE_ID } });
    expect(prisma.scheduleReferenceFile.createMany).not.toHaveBeenCalled();
    expect(result.externalLinks).toEqual([]);
    expect(result.referenceFiles).toEqual([]);
  });
});
