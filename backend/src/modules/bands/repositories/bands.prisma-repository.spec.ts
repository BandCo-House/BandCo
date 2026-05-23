import type { PrismaService } from '../../../database/prisma';

import { BandsPrismaRepository } from './bands.prisma-repository';

const mockCreatedAt = new Date('2026-04-10T12:00:00.000Z');

function createPrismaMock() {
  return {
    bandInvitation: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    bandBlacklist: {
      findFirst: jest.fn(),
    },
    bandMember: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };
}

describe('BandsPrismaRepository', () => {
  describe('acceptBandInvitation', () => {
    it('초대 상태를 수락으로 변경하고 밴드 멤버를 생성한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.update.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'ACCEPTED',
      });
      prisma.bandMember.create.mockResolvedValue({
        joinedAt: new Date('2026-04-30T10:00:00.000Z'),
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);
      const respondedAt = new Date('2026-04-30T09:59:00.000Z');

      const result = await repository.acceptBandInvitation('invitation-001', 'band-001', 'user-002', respondedAt);

      expect(prisma.bandInvitation.update).toHaveBeenCalledWith({
        where: {
          id: 'invitation-001',
        },
        data: {
          status: 'ACCEPTED',
          respondedAt,
        },
        select: {
          id: true,
          bandId: true,
          inviteeUserId: true,
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
      tx.bandInvitation.update.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'ACCEPTED',
      });
      tx.bandMember.create.mockResolvedValue({
        joinedAt: new Date('2026-04-30T10:00:00.000Z'),
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.acceptBandInvitation('invitation-001', 'band-001', 'user-002', new Date('2026-04-30T09:59:00.000Z'), tx as never);

      expect(tx.bandInvitation.update).toHaveBeenCalled();
      expect(tx.bandMember.create).toHaveBeenCalled();
      expect(prisma.bandInvitation.update).not.toHaveBeenCalled();
      expect(prisma.bandMember.create).not.toHaveBeenCalled();
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

  describe('findBandInvitationForAccept', () => {
    it('삭제되지 않은 밴드의 초대만 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findFirst.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'PENDING',
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandInvitationForAccept('invitation-001');

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
        },
      });
      expect(result).toEqual({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'PENDING',
      });
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
});
