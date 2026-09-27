import type { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';

import { BandSpacesPrismaRepository } from './bandspaces.prisma-repository';

const BAND_ID = '11111111-4111-4111-8111-111111111111';
const SPACE_ID = '22222222-4222-4222-8222-222222222222';
const REQUESTER_MEMBER_ID = '33333333-4333-4333-8333-333333333333';
const TARGET_MEMBER_ID = '44444444-4444-4444-8444-444444444444';
const OTHER_MEMBER_ID = '55555555-4555-4555-8555-555555555555';
const CREATED_AT = new Date('2026-09-01T00:00:00.000Z');

const createPrismaMock = () => ({
  bandSpace: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  spaceMember: {
    create: jest.fn(),
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
});

const bandSpaceRow = {
  id: SPACE_ID,
  bandId: BAND_ID,
  name: '가을 공연 준비',
  description: null,
  spaceType: 'PERFORMANCE',
  status: 'ACTIVE',
  startDate: new Date('2026-10-01T00:00:00.000Z'),
  endDate: new Date('2026-10-31T00:00:00.000Z'),
  createdByBandMemberId: REQUESTER_MEMBER_ID,
  createdAt: CREATED_AT,
  updatedAt: null,
  deletedAt: null,
};

const createInput = {
  name: '가을 공연 준비',
  spaceType: 'PERFORMANCE' as const,
  status: 'ACTIVE' as const,
  startDate: '2026-10-01',
  endDate: '2026-10-31',
};

describe('BandSpacesPrismaRepository', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let repository: BandSpacesPrismaRepository;
  let tx: Prisma.TransactionClient;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new BandSpacesPrismaRepository(prisma as unknown as PrismaService);
    // 외부 tx를 넘기면 repository가 그 client를 그대로 쓰므로 mock을 tx로 전달한다.
    tx = prisma as unknown as Prisma.TransactionClient;
    prisma.bandSpace.create.mockResolvedValue(bandSpaceRow);
    prisma.bandSpace.findFirst.mockResolvedValue({ id: SPACE_ID });
    prisma.bandSpace.update.mockResolvedValue(bandSpaceRow);
  });

  describe('createBandSpace', () => {
    it('생성자는 LEADER로, 나머지 참여 멤버는 중복 없이 MEMBER로 저장한다', async () => {
      await repository.createBandSpace(
        BAND_ID,
        REQUESTER_MEMBER_ID,
        { ...createInput, bandMemberIds: [REQUESTER_MEMBER_ID, TARGET_MEMBER_ID, TARGET_MEMBER_ID] },
        tx,
      );

      expect(prisma.spaceMember.create).toHaveBeenCalledWith({
        data: { bandSpaceId: SPACE_ID, bandMemberId: REQUESTER_MEMBER_ID, role: 'LEADER', status: 'ACTIVE' },
      });
      expect(prisma.spaceMember.createMany).toHaveBeenCalledWith({
        data: [{ bandSpaceId: SPACE_ID, bandMemberId: TARGET_MEMBER_ID, role: 'MEMBER', status: 'ACTIVE' }],
      });
    });

    it('참여 멤버가 생성자뿐이면 MEMBER 행을 만들지 않는다', async () => {
      await repository.createBandSpace(BAND_ID, REQUESTER_MEMBER_ID, { ...createInput, bandMemberIds: [REQUESTER_MEMBER_ID] }, tx);

      expect(prisma.spaceMember.create).toHaveBeenCalledTimes(1);
      expect(prisma.spaceMember.createMany).not.toHaveBeenCalled();
    });
  });

  describe('updateBandSpace', () => {
    it('참여 멤버를 보내면 목록에 없는 LEADER 외 멤버를 지우고 새 멤버를 추가한다', async () => {
      await repository.updateBandSpace(SPACE_ID, { bandMemberIds: [TARGET_MEMBER_ID, OTHER_MEMBER_ID, TARGET_MEMBER_ID] }, tx);

      expect(prisma.spaceMember.deleteMany).toHaveBeenCalledWith({
        where: {
          bandSpaceId: SPACE_ID,
          role: { not: 'LEADER' },
          bandMemberId: { notIn: [TARGET_MEMBER_ID, OTHER_MEMBER_ID] },
        },
      });
      expect(prisma.spaceMember.createMany).toHaveBeenCalledWith({
        data: [
          { bandSpaceId: SPACE_ID, bandMemberId: TARGET_MEMBER_ID, role: 'MEMBER', status: 'ACTIVE' },
          { bandSpaceId: SPACE_ID, bandMemberId: OTHER_MEMBER_ID, role: 'MEMBER', status: 'ACTIVE' },
        ],
        skipDuplicates: true,
      });
    });

    it('참여 멤버를 빈 배열로 보내면 LEADER 외 멤버를 모두 지우고 추가하지 않는다', async () => {
      await repository.updateBandSpace(SPACE_ID, { bandMemberIds: [] }, tx);

      expect(prisma.spaceMember.deleteMany).toHaveBeenCalledWith({
        where: { bandSpaceId: SPACE_ID, role: { not: 'LEADER' }, bandMemberId: { notIn: [] } },
      });
      expect(prisma.spaceMember.createMany).not.toHaveBeenCalled();
    });

    it('참여 멤버를 보내지 않으면 공간 멤버를 건드리지 않는다', async () => {
      await repository.updateBandSpace(SPACE_ID, { name: '이름만 수정' }, tx);

      expect(prisma.spaceMember.deleteMany).not.toHaveBeenCalled();
      expect(prisma.spaceMember.createMany).not.toHaveBeenCalled();
    });
  });
});
