import type { PrismaService } from '../../../database/prisma';

import { BandsPrismaRepository } from './bands.prisma-repository';

const mockCreatedAt = new Date('2026-04-10T12:00:00.000Z');

function createPrismaMock() {
  return {
    bandInvitation: {
      create: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    bandJoinRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    band: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    bandBlacklist: {
      findFirst: jest.fn(),
    },
    bandMember: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };
}

describe('BandsPrismaRepository', () => {
  describe('findSentBandInvitations', () => {
    it('보낸 초대 목록을 상태와 커서 기준으로 조회하고 매핑한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findMany.mockResolvedValue([
        {
          id: 'invitation-001',
          message: '같이 합주해요!',
          status: 'PENDING',
          createdAt: mockCreatedAt,
          respondedAt: null,
          band: {
            id: 'band-001',
            name: 'Rocking Stars',
            description: '직장인 밴드',
            _count: {
              members: 5,
            },
          },
          inviteeUserId: 'user-002',
          inviteeUser: {
            profile: {
              nickname: 'Choi',
              avatarUrl: 'https://cdn.example.com/avatar.png',
            },
          },
        },
      ]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findSentBandInvitations('user-001', {
        where__invitation_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      });

      expect(prisma.bandInvitation.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          band: {
            deletedAt: null,
          },
          inviterBandMember: {
            userId: 'user-001',
          },
          inviteeUser: {
            deletedAt: null,
          },
        },
        include: {
          band: {
            include: {
              _count: {
                select: {
                  members: true,
                },
              },
            },
          },
          inviteeUser: {
            include: {
              profile: {
                select: {
                  nickname: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
      });
      expect(result.items).toEqual([
        {
          invitationId: 'invitation-001',
          band: {
            bandId: 'band-001',
            name: 'Rocking Stars',
            description: '직장인 밴드',
            memberCount: 5,
          },
          invitee: {
            userId: 'user-002',
            nickname: 'Choi',
            avatarUrl: 'https://cdn.example.com/avatar.png',
          },
          invitationStatus: 'PENDING',
          message: '같이 합주해요!',
          createdAt: '2026-04-10T12:00:00.000Z',
          respondedAt: null,
        },
      ]);
      expect(result.meta).toEqual({
        count: 1,
        take: 20,
        totalCount: null,
        cursor: {
          id: 'invitation-001',
        },
        next: null,
      });
    });

    it('cursor__id가 있으면 Prisma cursor와 skip을 사용한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findMany.mockResolvedValue([]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.findSentBandInvitations('user-001', {
        where__invitation_status: 'DECLINED',
        order__created_at: 'asc',
        order__id: 'asc',
        take: 10,
        cursor__id: 'invitation-001',
      });

      expect(prisma.bandInvitation.findMany).toHaveBeenCalledWith(expect.objectContaining({ cursor: { id: 'invitation-001' }, skip: 1 }));
    });

    it('take보다 많이 조회되면 next cursor를 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findMany.mockResolvedValue([
        {
          id: 'invitation-001',
          message: null,
          status: 'PENDING',
          createdAt: mockCreatedAt,
          respondedAt: null,
          band: { id: 'band-001', name: 'Rocking Stars', description: null, _count: { members: 5 } },
          inviteeUserId: 'user-002',
          inviteeUser: { profile: null },
        },
        {
          id: 'invitation-002',
          message: null,
          status: 'PENDING',
          createdAt: new Date('2026-04-09T12:00:00.000Z'),
          respondedAt: null,
          band: { id: 'band-002', name: 'Jazz Stars', description: null, _count: { members: 4 } },
          inviteeUserId: 'user-003',
          inviteeUser: { profile: null },
        },
      ]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findSentBandInvitations('user-001', {
        where__invitation_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta.next).toBe(
        '/invitations/sent?where__invitation_status=PENDING&order__created_at=desc&order__id=desc&take=1&cursor__id=invitation-001',
      );
    });

    it('count=true이면 totalCount에 COUNT 쿼리 결과를 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findMany.mockResolvedValue([]);
      prisma.bandInvitation.count.mockResolvedValue(42);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findSentBandInvitations('user-001', {
        where__invitation_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
        count: true,
      });

      expect(prisma.bandInvitation.count).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          band: { deletedAt: null },
          inviterBandMember: { userId: 'user-001' },
          inviteeUser: { deletedAt: null },
        },
      });
      expect(result.meta.totalCount).toBe(42);
    });
  });

  describe('findSentBandJoinRequests', () => {
    it('보낸 가입 요청 목록을 상태와 커서 기준으로 조회하고 매핑한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.findMany.mockResolvedValue([
        {
          id: 'join-request-001',
          message: '기타로 합류하고 싶습니다!',
          status: 'PENDING',
          createdAt: mockCreatedAt,
          band: {
            id: 'band-001',
            name: 'Rocking Stars',
            description: '직장인 밴드',
            visibility: true,
          },
        },
      ]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findSentBandJoinRequests('user-001', {
        where__join_request_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      });

      expect(prisma.bandJoinRequest.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-001',
          status: 'PENDING',
          band: {
            deletedAt: null,
          },
        },
        include: {
          band: {
            select: {
              id: true,
              name: true,
              description: true,
              visibility: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
      });
      expect(result.items).toEqual([
        {
          joinRequestId: 'join-request-001',
          band: {
            bandId: 'band-001',
            name: 'Rocking Stars',
            description: '직장인 밴드',
            visibility: true,
          },
          joinRequestStatus: 'PENDING',
          message: '기타로 합류하고 싶습니다!',
          createdAt: '2026-04-10T12:00:00.000Z',
        },
      ]);
      expect(result.meta).toEqual({
        count: 1,
        take: 20,
        cursor: {
          id: 'join-request-001',
        },
        next: null,
      });
    });

    it('cursor__id가 있으면 Prisma cursor와 skip을 사용한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.findMany.mockResolvedValue([]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.findSentBandJoinRequests('user-001', {
        where__join_request_status: 'REJECTED',
        order__created_at: 'asc',
        order__id: 'asc',
        take: 10,
        cursor__id: 'join-request-001',
      });

      expect(prisma.bandJoinRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ cursor: { id: 'join-request-001' }, skip: 1 }));
    });

    it('take보다 많이 조회되면 next cursor를 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.findMany.mockResolvedValue([
        {
          id: 'join-request-001',
          message: null,
          status: 'PENDING',
          createdAt: mockCreatedAt,
          band: { id: 'band-001', name: 'Rocking Stars', description: null, visibility: true },
        },
        {
          id: 'join-request-002',
          message: null,
          status: 'PENDING',
          createdAt: new Date('2026-04-09T12:00:00.000Z'),
          band: { id: 'band-002', name: 'Jazz Stars', description: null, visibility: false },
        },
      ]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findSentBandJoinRequests('user-001', {
        where__join_request_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta.next).toEqual({
        id: 'join-request-001',
      });
    });
  });

  describe('findBandJoinRequests', () => {
    it('밴드로 들어온 가입 요청 목록을 상태와 커서 기준으로 조회하고 매핑한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.findMany.mockResolvedValue([
        {
          id: 'join-request-001',
          userId: 'user-002',
          message: '보컬로 참여하고 싶습니다.',
          status: 'PENDING',
          createdAt: mockCreatedAt,
          user: {
            profile: {
              nickname: 'Choi',
              avatarUrl: 'https://cdn.example.com/avatar.png',
            },
          },
        },
      ]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandJoinRequests('band-001', {
        where__join_request_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      });

      expect(prisma.bandJoinRequest.findMany).toHaveBeenCalledWith({
        where: {
          bandId: 'band-001',
          status: 'PENDING',
          band: {
            deletedAt: null,
          },
          user: {
            deletedAt: null,
          },
        },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  nickname: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
      });
      expect(result.items).toEqual([
        {
          joinRequestId: 'join-request-001',
          requester: {
            userId: 'user-002',
            nickname: 'Choi',
            avatarUrl: 'https://cdn.example.com/avatar.png',
          },
          joinRequestStatus: 'PENDING',
          message: '보컬로 참여하고 싶습니다.',
          createdAt: '2026-04-10T12:00:00.000Z',
        },
      ]);
      expect(result.meta).toEqual({
        count: 1,
        take: 20,
        cursor: {
          id: 'join-request-001',
        },
        next: null,
      });
    });

    it('cursor__id가 있으면 Prisma cursor와 skip을 사용한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.findMany.mockResolvedValue([]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.findBandJoinRequests('band-001', {
        where__join_request_status: 'APPROVED',
        order__created_at: 'asc',
        order__id: 'asc',
        take: 10,
        cursor__id: 'join-request-001',
      });

      expect(prisma.bandJoinRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ cursor: { id: 'join-request-001' }, skip: 1 }));
    });

    it('take보다 많이 조회되면 next cursor를 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.findMany.mockResolvedValue([
        {
          id: 'join-request-001',
          userId: 'user-002',
          message: null,
          status: 'PENDING',
          createdAt: mockCreatedAt,
          user: { profile: null },
        },
        {
          id: 'join-request-002',
          userId: 'user-003',
          message: null,
          status: 'PENDING',
          createdAt: new Date('2026-04-09T12:00:00.000Z'),
          user: { profile: null },
        },
      ]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandJoinRequests('band-001', {
        where__join_request_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta.next).toEqual({
        id: 'join-request-001',
      });
    });
  });

  describe('findReceivedBandInvitations', () => {
    it('받은 초대 목록을 상태와 커서 기준으로 조회하고 매핑한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findMany.mockResolvedValue([
        {
          id: 'invitation-001',
          message: '같이 밴드 하실래요?',
          status: 'PENDING',
          createdAt: mockCreatedAt,
          band: {
            id: 'band-001',
            name: 'Rocking Stars',
            description: '직장인 밴드',
          },
          inviterBandMember: {
            userId: 'user-001',
            user: {
              profile: {
                nickname: 'Jun',
              },
            },
          },
        },
      ]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findReceivedBandInvitations('user-002', {
        where__invitation_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      });

      expect(prisma.bandInvitation.findMany).toHaveBeenCalledWith({
        where: {
          inviteeUserId: 'user-002',
          status: 'PENDING',
          band: {
            deletedAt: null,
          },
          inviterBandMember: {
            user: {
              deletedAt: null,
            },
          },
        },
        include: {
          band: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          inviterBandMember: {
            include: {
              user: {
                include: {
                  profile: {
                    select: {
                      nickname: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
      });
      expect(result.items).toEqual([
        {
          invitationId: 'invitation-001',
          band: {
            bandId: 'band-001',
            name: 'Rocking Stars',
            description: '직장인 밴드',
          },
          inviter: {
            userId: 'user-001',
            nickname: 'Jun',
          },
          message: '같이 밴드 하실래요?',
          invitationStatus: 'PENDING',
          createdAt: '2026-04-10T12:00:00.000Z',
        },
      ]);
      expect(result.meta).toEqual({
        count: 1,
        take: 20,
        totalCount: null,
        cursor: {
          id: 'invitation-001',
        },
        next: null,
      });
    });

    it('cursor__id가 있으면 Prisma cursor와 skip을 사용한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findMany.mockResolvedValue([]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.findReceivedBandInvitations('user-002', {
        where__invitation_status: 'DECLINED',
        order__created_at: 'asc',
        order__id: 'asc',
        take: 10,
        cursor__id: 'invitation-001',
      });

      expect(prisma.bandInvitation.findMany).toHaveBeenCalledWith(expect.objectContaining({ cursor: { id: 'invitation-001' }, skip: 1 }));
    });

    it('take보다 많이 조회되면 next cursor를 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findMany.mockResolvedValue([
        {
          id: 'invitation-001',
          message: null,
          status: 'PENDING',
          createdAt: mockCreatedAt,
          band: { id: 'band-001', name: 'Rocking Stars', description: null },
          inviterBandMember: { userId: 'user-001', user: { profile: null } },
        },
        {
          id: 'invitation-002',
          message: null,
          status: 'PENDING',
          createdAt: new Date('2026-04-09T12:00:00.000Z'),
          band: { id: 'band-002', name: 'Jazz Stars', description: null },
          inviterBandMember: { userId: 'user-003', user: { profile: null } },
        },
      ]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findReceivedBandInvitations('user-002', {
        where__invitation_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta.next).toBe(
        '/invitations/received?where__invitation_status=PENDING&order__created_at=desc&order__id=desc&take=1&cursor__id=invitation-001',
      );
    });

    it('count=true이면 totalCount에 COUNT 쿼리 결과를 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findMany.mockResolvedValue([]);
      prisma.bandInvitation.count.mockResolvedValue(7);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findReceivedBandInvitations('user-002', {
        where__invitation_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
        count: true,
      });

      expect(prisma.bandInvitation.count).toHaveBeenCalledWith({
        where: {
          inviteeUserId: 'user-002',
          status: 'PENDING',
          band: { deletedAt: null },
          inviterBandMember: { user: { deletedAt: null } },
        },
      });
      expect(result.meta.totalCount).toBe(7);
    });
  });

  describe('findBandInvitationDetail', () => {
    it('초대 ID로 초대 상세 정보를 조회하고 매핑한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findFirst.mockResolvedValue({
        id: 'invitation-001',
        message: '같이 밴드 하실래요?',
        status: 'PENDING',
        createdAt: mockCreatedAt,
        band: {
          id: 'band-001',
          name: 'Rocking Stars',
          description: '직장인 밴드',
        },
        inviterBandMember: {
          userId: 'user-001',
          user: {
            profile: {
              nickname: 'Jun',
            },
          },
        },
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandInvitationDetail('invitation-001');

      expect(prisma.bandInvitation.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'invitation-001',
          band: {
            deletedAt: null,
          },
        },
        include: {
          band: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          inviterBandMember: {
            include: {
              user: {
                include: {
                  profile: {
                    select: {
                      nickname: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      expect(result).toEqual({
        invitationId: 'invitation-001',
        band: {
          bandId: 'band-001',
          name: 'Rocking Stars',
          description: '직장인 밴드',
        },
        inviter: {
          userId: 'user-001',
          nickname: 'Jun',
        },
        message: '같이 밴드 하실래요?',
        invitationStatus: 'PENDING',
        createdAt: '2026-04-10T12:00:00.000Z',
      });
    });

    it('초대가 없으면 null을 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findFirst.mockResolvedValue(null);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandInvitationDetail('invitation-missing');

      expect(result).toBeNull();
    });
  });

  describe('acceptBandInvitation', () => {
    it('밴드 멤버를 생성하고 초대 상태를 ACCEPTED로 변경한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandMember.create.mockResolvedValue({
        joinedAt: new Date('2026-04-30T10:00:00.000Z'),
      });
      const respondedAt = new Date('2026-04-30T09:59:00.000Z');
      prisma.bandInvitation.update.mockResolvedValue({ status: 'ACCEPTED', respondedAt });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.acceptBandInvitation('invitation-001', 'band-001', 'user-002', respondedAt);

      expect(prisma.bandMember.create).toHaveBeenCalledWith({
        data: {
          bandId: 'band-001',
          userId: 'user-002',
          role: 'MEMBER',
        },
        select: {
          joinedAt: true,
        },
      });
      expect(prisma.bandInvitation.update).toHaveBeenCalledWith({
        where: {
          id: 'invitation-001',
        },
        data: {
          status: 'ACCEPTED',
          respondedAt,
        },
        select: {
          status: true,
          respondedAt: true,
        },
      });
      expect(prisma.bandInvitation.delete).not.toHaveBeenCalled();
      expect(result).toEqual({
        invitationId: 'invitation-001',
        bandId: 'band-001',
        userId: 'user-002',
        invitationStatus: 'ACCEPTED',
        joinedAt: '2026-04-30T10:00:00.000Z',
      });
    });

    it('tx가 있으면 tx client로 수락 처리한다', async () => {
      const prisma = createPrismaMock();
      const tx = createPrismaMock();
      tx.bandMember.create.mockResolvedValue({
        joinedAt: new Date('2026-04-30T10:00:00.000Z'),
      });
      tx.bandInvitation.update.mockResolvedValue({ status: 'ACCEPTED', respondedAt: new Date('2026-04-30T09:59:00.000Z') });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.acceptBandInvitation('invitation-001', 'band-001', 'user-002', new Date('2026-04-30T09:59:00.000Z'), tx as never);

      expect(tx.bandMember.create).toHaveBeenCalled();
      expect(tx.bandInvitation.update).toHaveBeenCalled();
      expect(prisma.bandMember.create).not.toHaveBeenCalled();
      expect(prisma.bandInvitation.update).not.toHaveBeenCalled();
    });
  });

  describe('approveBandJoinRequest', () => {
    it('가입 요청 상태를 승인으로 변경하고 밴드 멤버를 생성한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.update.mockResolvedValue({
        id: 'join-request-001',
        bandId: 'band-001',
        userId: 'user-002',
        status: 'APPROVED',
      });
      prisma.bandMember.create.mockResolvedValue({
        joinedAt: new Date('2026-04-30T10:00:00.000Z'),
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.approveBandJoinRequest('join-request-001', 'band-001', 'user-002');

      expect(prisma.bandJoinRequest.update).toHaveBeenCalledWith({
        where: {
          id: 'join-request-001',
        },
        data: {
          status: 'APPROVED',
        },
        select: {
          id: true,
          bandId: true,
          userId: true,
          status: true,
        },
      });
      expect(prisma.bandMember.create).toHaveBeenCalledWith({
        data: {
          bandId: 'band-001',
          userId: 'user-002',
          role: 'MEMBER',
        },
        select: {
          joinedAt: true,
        },
      });
      expect(result).toEqual({
        joinRequestId: 'join-request-001',
        bandId: 'band-001',
        userId: 'user-002',
        joinRequestStatus: 'APPROVED',
        joinedAt: '2026-04-30T10:00:00.000Z',
      });
    });

    it('tx가 있으면 tx client로 승인 처리한다', async () => {
      const prisma = createPrismaMock();
      const tx = createPrismaMock();
      tx.bandJoinRequest.update.mockResolvedValue({
        id: 'join-request-001',
        bandId: 'band-001',
        userId: 'user-002',
        status: 'APPROVED',
      });
      tx.bandMember.create.mockResolvedValue({
        joinedAt: new Date('2026-04-30T10:00:00.000Z'),
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.approveBandJoinRequest('join-request-001', 'band-001', 'user-002', tx as never);

      expect(tx.bandJoinRequest.update).toHaveBeenCalled();
      expect(tx.bandMember.create).toHaveBeenCalled();
      expect(prisma.bandJoinRequest.update).not.toHaveBeenCalled();
      expect(prisma.bandMember.create).not.toHaveBeenCalled();
    });
  });

  describe('declineBandInvitation', () => {
    it('초대 상태를 거절로 변경하고 응답 시각을 반환한다', async () => {
      const prisma = createPrismaMock();
      const respondedAt = new Date('2026-04-30T10:00:00.000Z');
      prisma.bandInvitation.update.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'DECLINED',
        respondedAt,
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.declineBandInvitation('invitation-001', respondedAt);

      expect(prisma.bandInvitation.update).toHaveBeenCalledWith({
        where: {
          id: 'invitation-001',
        },
        data: {
          status: 'DECLINED',
          respondedAt,
        },
        select: {
          id: true,
          bandId: true,
          inviteeUserId: true,
          status: true,
          respondedAt: true,
        },
      });
      expect(result).toEqual({
        invitationId: 'invitation-001',
        bandId: 'band-001',
        userId: 'user-002',
        invitationStatus: 'DECLINED',
        respondedAt: '2026-04-30T10:00:00.000Z',
      });
    });

    it('tx가 있으면 tx client로 거절 처리한다', async () => {
      const prisma = createPrismaMock();
      const tx = createPrismaMock();
      const respondedAt = new Date('2026-04-30T10:00:00.000Z');
      tx.bandInvitation.update.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'DECLINED',
        respondedAt,
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.declineBandInvitation('invitation-001', respondedAt, tx as never);

      expect(tx.bandInvitation.update).toHaveBeenCalled();
      expect(prisma.bandInvitation.update).not.toHaveBeenCalled();
    });
  });

  describe('rejectBandJoinRequest', () => {
    it('가입 요청 상태를 거절로 변경하고 결과를 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.update.mockResolvedValue({
        id: 'join-request-001',
        bandId: 'band-001',
        userId: 'user-002',
        status: 'REJECTED',
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.rejectBandJoinRequest('join-request-001');

      expect(prisma.bandJoinRequest.update).toHaveBeenCalledWith({
        where: {
          id: 'join-request-001',
        },
        data: {
          status: 'REJECTED',
        },
        select: {
          id: true,
          bandId: true,
          userId: true,
          status: true,
        },
      });
      expect(result).toEqual({
        joinRequestId: 'join-request-001',
        bandId: 'band-001',
        userId: 'user-002',
        joinRequestStatus: 'REJECTED',
      });
    });

    it('tx가 있으면 tx client로 거절 처리한다', async () => {
      const prisma = createPrismaMock();
      const tx = createPrismaMock();
      tx.bandJoinRequest.update.mockResolvedValue({
        id: 'join-request-001',
        bandId: 'band-001',
        userId: 'user-002',
        status: 'REJECTED',
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.rejectBandJoinRequest('join-request-001', tx as never);

      expect(tx.bandJoinRequest.update).toHaveBeenCalled();
      expect(prisma.bandJoinRequest.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteBandInvitation', () => {
    it('초대 row를 삭제하고 invitationId를 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.delete.mockResolvedValue(undefined);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.deleteBandInvitation('invitation-001');

      expect(prisma.bandInvitation.delete).toHaveBeenCalledWith({
        where: {
          id: 'invitation-001',
        },
      });
      expect(result).toEqual({
        invitationId: 'invitation-001',
      });
    });

    it('tx가 있으면 tx client로 초대를 삭제한다', async () => {
      const prisma = createPrismaMock();
      const tx = createPrismaMock();
      tx.bandInvitation.delete.mockResolvedValue(undefined);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.deleteBandInvitation('invitation-001', tx as never);

      expect(tx.bandInvitation.delete).toHaveBeenCalled();
      expect(prisma.bandInvitation.delete).not.toHaveBeenCalled();
    });
  });

  describe('createBandInvitation', () => {
    it('밴드 초대를 생성하고 응답 필드로 매핑한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.create.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'PENDING',
        createdAt: mockCreatedAt,
        inviterBandMember: {
          userId: 'user-001',
        },
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.createBandInvitation({
        bandId: 'band-001',
        inviterBandMemberId: 'band-member-001',
        inviteeUserId: 'user-002',
        message: '같이 밴드 하실래요?',
      });

      expect(prisma.bandInvitation.create).toHaveBeenCalledWith({
        data: {
          bandId: 'band-001',
          inviterBandMemberId: 'band-member-001',
          inviteeUserId: 'user-002',
          message: '같이 밴드 하실래요?',
        },
        select: {
          id: true,
          bandId: true,
          inviteeUserId: true,
          status: true,
          createdAt: true,
          inviterBandMember: {
            select: {
              userId: true,
            },
          },
        },
      });
      expect(result).toEqual({
        invitationId: 'invitation-001',
        bandId: 'band-001',
        inviterUserId: 'user-001',
        inviteeUserId: 'user-002',
        invitationStatus: 'PENDING',
        createdAt: '2026-04-10T12:00:00.000Z',
      });
    });

    it('tx가 있으면 tx client로 초대를 생성한다', async () => {
      const prisma = createPrismaMock();
      const tx = createPrismaMock();
      tx.bandInvitation.create.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'PENDING',
        createdAt: mockCreatedAt,
        inviterBandMember: {
          userId: 'user-001',
        },
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.createBandInvitation(
        {
          bandId: 'band-001',
          inviterBandMemberId: 'band-member-001',
          inviteeUserId: 'user-002',
        },
        tx as never,
      );

      expect(tx.bandInvitation.create).toHaveBeenCalled();
      expect(prisma.bandInvitation.create).not.toHaveBeenCalled();
    });
  });

  describe('createBandJoinRequest', () => {
    it('밴드 가입 요청을 생성하고 응답 필드로 매핑한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.create.mockResolvedValue({
        id: 'join-request-001',
        bandId: 'band-001',
        userId: 'user-002',
        status: 'PENDING',
        createdAt: mockCreatedAt,
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.createBandJoinRequest({
        bandId: 'band-001',
        userId: 'user-002',
        message: '기타로 합류하고 싶습니다!',
      });

      expect(prisma.bandJoinRequest.create).toHaveBeenCalledWith({
        data: {
          bandId: 'band-001',
          userId: 'user-002',
          message: '기타로 합류하고 싶습니다!',
        },
        select: {
          id: true,
          bandId: true,
          userId: true,
          status: true,
          createdAt: true,
        },
      });
      expect(result).toEqual({
        joinRequestId: 'join-request-001',
        bandId: 'band-001',
        userId: 'user-002',
        joinRequestStatus: 'PENDING',
        createdAt: '2026-04-10T12:00:00.000Z',
      });
    });

    it('tx가 있으면 tx client로 가입 요청을 생성한다', async () => {
      const prisma = createPrismaMock();
      const tx = createPrismaMock();
      tx.bandJoinRequest.create.mockResolvedValue({
        id: 'join-request-001',
        bandId: 'band-001',
        userId: 'user-002',
        status: 'PENDING',
        createdAt: mockCreatedAt,
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.createBandJoinRequest(
        {
          bandId: 'band-001',
          userId: 'user-002',
        },
        tx as never,
      );

      expect(tx.bandJoinRequest.create).toHaveBeenCalled();
      expect(prisma.bandJoinRequest.create).not.toHaveBeenCalled();
    });
  });

  describe('findBandForJoinRequest', () => {
    it('삭제되지 않은 밴드의 공개 상태를 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.band.findFirst.mockResolvedValue({
        id: 'band-001',
        visibility: true,
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandForJoinRequest('band-001');

      expect(prisma.band.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'band-001',
          deletedAt: null,
        },
        select: {
          id: true,
          visibility: true,
        },
      });
      expect(result).toEqual({
        id: 'band-001',
        visibility: true,
      });
    });
  });

  describe('findBandJoinRequestByBandIdAndUserId', () => {
    it('밴드와 사용자 기준으로 기존 가입 요청을 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.findFirst.mockResolvedValue({
        id: 'join-request-001',
        status: 'PENDING',
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandJoinRequestByBandIdAndUserId('band-001', 'user-002');

      expect(prisma.bandJoinRequest.findFirst).toHaveBeenCalledWith({
        where: {
          bandId: 'band-001',
          userId: 'user-002',
        },
        select: {
          id: true,
          status: true,
        },
      });
      expect(result).toEqual({
        id: 'join-request-001',
        status: 'PENDING',
      });
    });
  });

  describe('findBandJoinRequestForResponse', () => {
    it('삭제되지 않은 밴드와 활성 사용자에 연결된 가입 요청만 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.findFirst.mockResolvedValue({
        id: 'join-request-001',
        bandId: 'band-001',
        userId: 'user-002',
        status: 'PENDING',
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandJoinRequestForResponse('join-request-001');

      expect(prisma.bandJoinRequest.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'join-request-001',
          band: {
            deletedAt: null,
          },
          user: {
            deletedAt: null,
          },
        },
        select: {
          id: true,
          bandId: true,
          userId: true,
          status: true,
        },
      });
      expect(result).toEqual({
        id: 'join-request-001',
        bandId: 'band-001',
        userId: 'user-002',
        status: 'PENDING',
      });
    });
  });

  describe('findBandInvitationByBandIdAndInviteeUserId', () => {
    it('밴드와 초대 대상 기준으로 기존 초대를 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findFirst.mockResolvedValue({
        id: 'invitation-001',
        status: 'PENDING',
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandInvitationByBandIdAndInviteeUserId('band-001', 'user-002');

      expect(prisma.bandInvitation.findFirst).toHaveBeenCalledWith({
        where: {
          bandId: 'band-001',
          inviteeUserId: 'user-002',
        },
        select: {
          id: true,
          status: true,
        },
      });
      expect(result).toEqual({
        id: 'invitation-001',
        status: 'PENDING',
      });
    });
  });

  describe('findBandInvitationForResponse', () => {
    it('삭제되지 않은 밴드의 초대만 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findFirst.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviterBandMember: {
          userId: 'user-001',
        },
        inviteeUserId: 'user-002',
        status: 'PENDING',
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandInvitationForResponse('invitation-001');

      expect(prisma.bandInvitation.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'invitation-001',
          band: {
            deletedAt: null,
          },
        },
        select: {
          id: true,
          bandId: true,
          inviteeUserId: true,
          status: true,
          inviterBandMember: {
            select: {
              userId: true,
            },
          },
        },
      });
      expect(result).toEqual({
        id: 'invitation-001',
        bandId: 'band-001',
        inviterUserId: 'user-001',
        inviteeUserId: 'user-002',
        status: 'PENDING',
      });
    });
  });

  describe('findBandInvitationForDelete', () => {
    it('삭제되지 않은 밴드의 초대와 초대한 사용자 ID를 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findFirst.mockResolvedValue({
        id: 'invitation-001',
        status: 'PENDING',
        inviterBandMember: {
          userId: 'user-001',
        },
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandInvitationForDelete('invitation-001');

      expect(prisma.bandInvitation.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'invitation-001',
          band: {
            deletedAt: null,
          },
        },
        select: {
          id: true,
          status: true,
          inviterBandMember: {
            select: {
              userId: true,
            },
          },
        },
      });
      expect(result).toEqual({
        id: 'invitation-001',
        status: 'PENDING',
        inviterUserId: 'user-001',
      });
    });

    it('초대가 없으면 null을 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findFirst.mockResolvedValue(null);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandInvitationForDelete('invitation-missing');

      expect(result).toBeNull();
    });
  });

  describe('findBandBlacklistByBandIdAndUserId', () => {
    it('밴드와 사용자 기준으로 차단 정보를 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandBlacklist.findFirst.mockResolvedValue({
        id: 'blacklist-001',
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandBlacklistByBandIdAndUserId('band-001', 'user-002');

      expect(prisma.bandBlacklist.findFirst).toHaveBeenCalledWith({
        where: {
          bandId: 'band-001',
          userId: 'user-002',
        },
        select: {
          id: true,
        },
      });
      expect(result).toEqual({
        id: 'blacklist-001',
      });
    });
  });

  describe('findBandMemberByBandIdAndUserId', () => {
    it('밴드 멤버 역할까지 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandMember.findFirst.mockResolvedValue({
        id: 'band-member-001',
        userId: 'user-001',
        role: 'BM',
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandMemberByBandIdAndUserId('band-001', 'user-001');

      expect(prisma.bandMember.findFirst).toHaveBeenCalledWith({
        where: {
          bandId: 'band-001',
          userId: 'user-001',
        },
        select: {
          id: true,
          userId: true,
          role: true,
        },
      });
      expect(result).toEqual({
        id: 'band-member-001',
        userId: 'user-001',
        role: 'BM',
      });
    });
  });

  describe('findBandMembers', () => {
    const makeMemberRow = (id: string, joinedAt: Date) => ({
      id,
      userId: `user-${id}`,
      role: 'MEMBER',
      joinedAt,
      user: {
        profile: { nickname: `Nick-${id}`, avatarUrl: null },
        userSkills: [],
      },
    });

    it('조회 수가 take보다 적으면 next가 null이다', async () => {
      const prisma = createPrismaMock();
      prisma.bandMember.findMany.mockResolvedValue([makeMemberRow('m1', mockCreatedAt)]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandMembers('band-001', {
        order__joined_at: 'desc',
        order__id: 'desc',
        take: 20,
      });

      expect(result.meta.next).toBeNull();
    });

    it('조회 수가 take와 같으면 next URL을 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandMember.findMany.mockResolvedValue([makeMemberRow('m1', mockCreatedAt)]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandMembers('band-001', {
        order__joined_at: 'desc',
        order__id: 'desc',
        take: 1,
      });

      expect(typeof result.meta.next).toBe('string');
      expect(result.meta.next).toContain('/bands/band-001/users');
      expect(result.meta.next).toContain('cursor__joined_at=');
      expect(result.meta.next).toContain('cursor__id=m1');
    });

    it('cursor 조건이 있으면 cursor where가 추가된다', async () => {
      const prisma = createPrismaMock();
      prisma.bandMember.findMany.mockResolvedValue([]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.findBandMembers('band-001', {
        order__joined_at: 'desc',
        order__id: 'desc',
        take: 20,
        cursor__joined_at: mockCreatedAt.toISOString(),
        cursor__id: 'm0',
      });

      expect(prisma.bandMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });
  });

  describe('searchBands', () => {
    const makeBandRow = (id: string, createdAt: Date) => ({
      id,
      name: `Band-${id}`,
      description: null,
      visibility: true,
      createdAt,
      bandMasterUserId: 'user-bm',
      bandMasterUser: { profile: { nickname: 'BM' } },
      _count: { members: 3 },
    });

    it('조회 수가 take보다 적으면 next가 null이다', async () => {
      const prisma = createPrismaMock();
      prisma.band.findMany.mockResolvedValue([makeBandRow('b1', mockCreatedAt)]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.searchBands({
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      });

      expect(result.meta.next).toBeNull();
    });

    it('조회 수가 take와 같으면 next URL을 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.band.findMany.mockResolvedValue([makeBandRow('b1', mockCreatedAt)]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.searchBands({
        order__created_at: 'desc',
        order__id: 'desc',
        take: 1,
      });

      expect(typeof result.meta.next).toBe('string');
      expect(result.meta.next).toContain('/bands/search');
      expect(result.meta.next).toContain('cursor__created_at=');
      expect(result.meta.next).toContain('cursor__id=b1');
    });

    it('where__name__contain이 있으면 next URL에 포함된다', async () => {
      const prisma = createPrismaMock();
      prisma.band.findMany.mockResolvedValue([makeBandRow('b1', mockCreatedAt)]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.searchBands({
        where__name__contain: 'rock',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 1,
      });

      expect(result.meta.next).toContain('where__name__contain=rock');
    });
  });

  describe('findMyBands', () => {
    const makeBandRow = (id: string, createdAt: Date) => ({
      id,
      name: `Band-${id}`,
      description: null,
      visibility: true,
      createdAt,
      bandMasterUserId: 'user-bm',
      members: [{ role: 'MEMBER', joinedAt: mockCreatedAt }],
      _count: { members: 2 },
    });

    it('조회 수가 take보다 적으면 next가 null이다', async () => {
      const prisma = createPrismaMock();
      prisma.band.findMany.mockResolvedValue([makeBandRow('b1', mockCreatedAt)]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findMyBands('user-001', { take: 20 });

      expect(result.meta.next).toBeNull();
    });

    it('조회 수가 take와 같으면 next URL을 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.band.findMany.mockResolvedValue([makeBandRow('b1', mockCreatedAt)]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findMyBands('user-001', { take: 1 });

      expect(typeof result.meta.next).toBe('string');
      expect(result.meta.next).toContain('/bands/me');
      expect(result.meta.next).toContain('cursor__created_at=');
      expect(result.meta.next).toContain('cursor__id=b1');
    });
  });
});
