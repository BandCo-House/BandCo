import type { PrismaService } from 'src/database/prisma';
import { BandSpaceMemberStatus } from 'src/generated/prisma';

import { SchedulePollsPrismaRepository } from './schedule-polls.prisma-repository';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const BAND_SPACE_ID = '22222222-2222-4222-8222-222222222222';
const BAND_MEMBER_ID = '33333333-3333-4333-8333-333333333333';
const SCHEDULE_POLL_ID = '44444444-4444-4444-8444-444444444444';
const OPTION_ID = '55555555-5555-4555-8555-555555555555';

const POLL_ROW = {
  id: SCHEDULE_POLL_ID,
  bandSpaceId: BAND_SPACE_ID,
  createdByBandMemberId: BAND_MEMBER_ID,
  createdAt: new Date('2026-09-07T00:00:00.000Z'),
  updatedAt: new Date('2026-09-07T00:00:00.000Z'),
  options: [
    {
      id: OPTION_ID,
      schedulePollId: SCHEDULE_POLL_ID,
      startAt: new Date('2026-09-13T12:00:00.000Z'),
      endAt: new Date('2026-09-13T14:00:00.000Z'),
      createdAt: new Date('2026-09-07T00:00:00.000Z'),
      votes: [
        {
          id: '66666666-6666-4666-8666-666666666666',
          schedulePollOptionId: OPTION_ID,
          bandMemberId: BAND_MEMBER_ID,
          createdAt: new Date('2026-09-07T00:00:00.000Z'),
          bandMember: {
            id: BAND_MEMBER_ID,
            bandId: '77777777-7777-4777-8777-777777777777',
            userId: USER_ID,
            role: 'MEMBER' as const,
            joinedAt: new Date('2026-01-01T00:00:00.000Z'),
            user: {
              id: USER_ID,
              email: 'member@example.com',
              passwordHash: null,
              status: 'ACTIVE' as const,
              lastLoginAt: null,
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
              deletedAt: null,
              updatedAt: new Date('2026-01-01T00:00:00.000Z'),
              profile: {
                userId: USER_ID,
                nickname: '준혁',
                selfDescription: null,
                avatarUrl: 'https://example.com/avatar.png',
                updatedAt: null,
              },
            },
          },
        },
      ],
    },
  ],
};

function createPrismaMock() {
  return {
    bandSpace: { findFirst: jest.fn() },
    spaceMember: { findFirst: jest.fn() },
    schedulePoll: { create: jest.fn(), findFirst: jest.fn() },
    schedulePollOption: { count: jest.fn() },
    schedulePollVote: { deleteMany: jest.fn(), createMany: jest.fn() },
  };
}

describe('SchedulePollsPrismaRepository', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let repository: SchedulePollsPrismaRepository;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new SchedulePollsPrismaRepository(prisma as unknown as PrismaService);
  });

  it('삭제되지 않은 합주 공간을 조회한다', async () => {
    prisma.bandSpace.findFirst.mockResolvedValue({ id: BAND_SPACE_ID });

    await repository.findActiveBandSpaceById(BAND_SPACE_ID);

    expect(prisma.bandSpace.findFirst).toHaveBeenCalledWith({
      where: { id: BAND_SPACE_ID, deletedAt: null },
      select: { id: true },
    });
  });

  it('활성 합주 공간 멤버의 밴드 멤버 ID를 조회한다', async () => {
    prisma.spaceMember.findFirst.mockResolvedValue({ bandMemberId: BAND_MEMBER_ID });

    await repository.findActiveSpaceMemberByUserId(BAND_SPACE_ID, USER_ID);

    expect(prisma.spaceMember.findFirst).toHaveBeenCalledWith({
      where: {
        bandSpaceId: BAND_SPACE_ID,
        status: BandSpaceMemberStatus.ACTIVE,
        bandMember: { userId: USER_ID },
      },
      select: { bandMemberId: true },
    });
  });

  it('후보 시간을 중첩 생성하고 생성 결과를 매핑한다', async () => {
    prisma.schedulePoll.create.mockResolvedValue(POLL_ROW);

    const result = await repository.createSchedulePoll(BAND_SPACE_ID, BAND_MEMBER_ID, {
      options: [{ startAt: '2026-09-13T12:00:00.000Z', endAt: '2026-09-13T14:00:00.000Z' }],
    });

    expect(prisma.schedulePoll.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          bandSpaceId: BAND_SPACE_ID,
          createdByBandMemberId: BAND_MEMBER_ID,
          options: {
            create: [{ startAt: new Date('2026-09-13T12:00:00.000Z'), endAt: new Date('2026-09-13T14:00:00.000Z') }],
          },
        },
      }),
    );
    expect(result.options[0].voters[0]).toEqual({
      bandMemberId: BAND_MEMBER_ID,
      userId: USER_ID,
      nickname: '준혁',
      avatarUrl: 'https://example.com/avatar.png',
    });
    expect(result.myOptionIds).toEqual([OPTION_ID]);
  });

  it('상세 조회에서 현재 멤버가 선택한 후보 ID를 함께 반환한다', async () => {
    prisma.schedulePoll.findFirst.mockResolvedValue(POLL_ROW);

    const result = await repository.findSchedulePollById(SCHEDULE_POLL_ID, BAND_MEMBER_ID);

    expect(result?.myOptionIds).toEqual([OPTION_ID]);
    expect(result?.options[0].startAt).toBe('2026-09-13T12:00:00.000Z');
  });

  it('기존 투표를 삭제하고 새 선택을 생성한다', async () => {
    prisma.schedulePollVote.deleteMany.mockResolvedValue({ count: 1 });
    prisma.schedulePollVote.createMany.mockResolvedValue({ count: 1 });

    await repository.replaceSchedulePollVotes(SCHEDULE_POLL_ID, BAND_MEMBER_ID, [OPTION_ID]);

    expect(prisma.schedulePollVote.deleteMany).toHaveBeenCalledWith({
      where: {
        bandMemberId: BAND_MEMBER_ID,
        schedulePollOption: { schedulePollId: SCHEDULE_POLL_ID },
      },
    });
    expect(prisma.schedulePollVote.createMany).toHaveBeenCalledWith({
      data: [{ schedulePollOptionId: OPTION_ID, bandMemberId: BAND_MEMBER_ID }],
    });
  });

  it('빈 선택이면 기존 투표만 삭제한다', async () => {
    prisma.schedulePollVote.deleteMany.mockResolvedValue({ count: 1 });

    await repository.replaceSchedulePollVotes(SCHEDULE_POLL_ID, BAND_MEMBER_ID, []);

    expect(prisma.schedulePollVote.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.schedulePollVote.createMany).not.toHaveBeenCalled();
  });
});
