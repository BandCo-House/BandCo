import type { PrismaService } from '../../../database/prisma';

import { SkillsPrismaRepository } from './skills.prisma-repository';

const createPrismaMock = () => ({
  skillType: {
    findMany: jest.fn(),
  },
});

describe('SkillsPrismaRepository', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let repository: SkillsPrismaRepository;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new SkillsPrismaRepository(prisma as unknown as PrismaService);
  });

  describe('findExistingSkillTypeIds', () => {
    it('존재하는 세션 타입 ID만 의미 있는 타입으로 감싸 반환한다', async () => {
      prisma.skillType.findMany.mockResolvedValue([{ id: 'skill-type-1' }, { id: 'skill-type-2' }]);

      const result = await repository.findExistingSkillTypeIds(['skill-type-1', 'skill-type-2']);

      expect(prisma.skillType.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['skill-type-1', 'skill-type-2'],
          },
        },
        select: {
          id: true,
        },
      });
      expect(result).toEqual({ skillTypeIds: ['skill-type-1', 'skill-type-2'] });
    });

    it('tx가 전달되면 tx 클라이언트를 사용한다', async () => {
      const tx = {
        skillType: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };

      await repository.findExistingSkillTypeIds(['skill-type-1'], tx as never);

      expect(tx.skillType.findMany).toHaveBeenCalled();
      expect(prisma.skillType.findMany).not.toHaveBeenCalled();
    });
  });
});
