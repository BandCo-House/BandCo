import type { PrismaService } from '../../../database/prisma';

import { BandInviteLinksPrismaRepository } from './band-invite-links.prisma-repository';

const createPrismaMock = () => ({
  band: {
    findFirst: jest.fn(),
  },
  bandInviteLink: {
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
  },
  bandMember: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  bandBlacklist: {
    findFirst: jest.fn(),
  },
  bandInvitation: {
    deleteMany: jest.fn(),
  },
  bandJoinRequest: {
    deleteMany: jest.fn(),
  },
});

describe('BandInviteLinksPrismaRepository', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let repository: BandInviteLinksPrismaRepository;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new BandInviteLinksPrismaRepository(prisma as unknown as PrismaService);
  });

  it('삭제되지 않은 밴드와 요청자 멤버를 조회한다', async () => {
    prisma.band.findFirst.mockResolvedValue({
      id: 'band-id',
      members: [
        {
          id: 'band-member-id',
          role: 'BM',
        },
      ],
    });

    const result = await repository.findActiveBandWithRequesterMember('band-id', 'user-id');

    expect(prisma.band.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'band-id',
        deletedAt: null,
      },
      select: {
        id: true,
        members: {
          where: {
            userId: 'user-id',
          },
          select: {
            id: true,
            role: true,
          },
          take: 1,
        },
      },
    });
    expect(result).toEqual({
      id: 'band-id',
      member: {
        id: 'band-member-id',
        role: 'BM',
      },
    });
  });

  it('밴드가 없으면 null을 반환한다', async () => {
    prisma.band.findFirst.mockResolvedValue(null);

    const result = await repository.findActiveBandWithRequesterMember('band-id', 'user-id');

    expect(result).toBeNull();
  });

  it('밴드 ID를 기준으로 초대 링크를 생성하거나 교체한다', async () => {
    const expiredAt = new Date('2026-08-04T00:00:00.000Z');
    prisma.bandInviteLink.upsert.mockResolvedValue({
      bandId: 'band-id',
      expiredAt,
    });

    const result = await repository.upsertBandInviteLink({
      bandId: 'band-id',
      createBandMemberId: 'band-member-id',
      codeHash: 'code-hash',
      expiredAt,
    });

    expect(prisma.bandInviteLink.upsert).toHaveBeenCalledWith({
      where: {
        bandId: 'band-id',
      },
      update: {
        createBandMemberId: 'band-member-id',
        codeHash: 'code-hash',
        expiredAt,
      },
      create: {
        bandId: 'band-id',
        createBandMemberId: 'band-member-id',
        codeHash: 'code-hash',
        expiredAt,
      },
      select: {
        bandId: true,
        expiredAt: true,
      },
    });
    expect(result).toEqual({
      bandId: 'band-id',
      expiredAt,
    });
  });

  it('tx가 전달되면 tx 클라이언트로 초대 링크를 저장한다', async () => {
    const expiredAt = new Date('2026-08-04T00:00:00.000Z');
    const tx = {
      bandInviteLink: {
        upsert: jest.fn().mockResolvedValue({
          bandId: 'band-id',
          expiredAt,
        }),
      },
    };

    await repository.upsertBandInviteLink(
      {
        bandId: 'band-id',
        createBandMemberId: 'band-member-id',
        codeHash: 'code-hash',
        expiredAt,
      },
      tx as never,
    );

    expect(tx.bandInviteLink.upsert).toHaveBeenCalled();
    expect(prisma.bandInviteLink.upsert).not.toHaveBeenCalled();
  });

  it('삭제된 초대 링크가 있으면 true를 반환한다', async () => {
    prisma.bandInviteLink.deleteMany.mockResolvedValue({ count: 1 });

    const result = await repository.deleteBandInviteLinkByBandId('band-id');

    expect(prisma.bandInviteLink.deleteMany).toHaveBeenCalledWith({
      where: {
        bandId: 'band-id',
      },
    });
    expect(result).toBe(true);
  });

  it('코드 해시와 활성 밴드 조건으로 초대 링크를 조회한다', async () => {
    const expiredAt = new Date('2026-08-04T00:00:00.000Z');
    prisma.bandInviteLink.findFirst.mockResolvedValue({
      bandId: 'band-id',
      expiredAt,
    });

    const result = await repository.findBandInviteLinkByCodeHash('code-hash');

    expect(prisma.bandInviteLink.findFirst).toHaveBeenCalledWith({
      where: {
        codeHash: 'code-hash',
        band: {
          deletedAt: null,
        },
      },
      select: {
        bandId: true,
        expiredAt: true,
      },
    });
    expect(result).toEqual({
      bandId: 'band-id',
      expiredAt,
    });
  });

  it('링크 가입 사용자를 일반 멤버로 생성한다', async () => {
    const joinedAt = new Date('2026-07-28T00:00:00.000Z');
    prisma.bandMember.create.mockResolvedValue({
      id: 'band-member-id',
      joinedAt,
    });

    const result = await repository.createBandMember('band-id', 'user-id');

    expect(prisma.bandMember.create).toHaveBeenCalledWith({
      data: {
        bandId: 'band-id',
        userId: 'user-id',
        role: 'MEMBER',
      },
      select: {
        id: true,
        joinedAt: true,
      },
    });
    expect(result).toEqual({
      id: 'band-member-id',
      joinedAt,
    });
  });

  it('링크 가입 후 대기 중인 직접 초대와 가입 요청을 삭제한다', async () => {
    prisma.bandInvitation.deleteMany.mockResolvedValue({ count: 1 });
    prisma.bandJoinRequest.deleteMany.mockResolvedValue({ count: 1 });

    await repository.deletePendingBandEntryRequests('band-id', 'user-id');

    expect(prisma.bandInvitation.deleteMany).toHaveBeenCalledWith({
      where: {
        bandId: 'band-id',
        inviteeUserId: 'user-id',
        status: 'PENDING',
      },
    });
    expect(prisma.bandJoinRequest.deleteMany).toHaveBeenCalledWith({
      where: {
        bandId: 'band-id',
        userId: 'user-id',
        status: 'PENDING',
      },
    });
  });
});
