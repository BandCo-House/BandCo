import type { PrismaService } from '../../../database/prisma';

import { AssistantPrismaRepository } from './assistant.prisma-repository';

describe('AssistantPrismaRepository', () => {
  const createPrismaMock = () => ({
    bandMember: { findFirst: jest.fn() },
  });

  it('삭제되지 않은 밴드의 멤버십을 조회한다', async () => {
    const prisma = createPrismaMock();
    prisma.bandMember.findFirst.mockResolvedValue({ id: 'member-1' });
    const repository = new AssistantPrismaRepository(prisma as unknown as PrismaService);

    await repository.findBandMemberByBandIdAndUserId('band-1', 'user-1');

    expect(prisma.bandMember.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1', band: { id: 'band-1', deletedAt: null } },
      select: { id: true },
    });
  });

  it('transaction을 read-only와 3초 statement timeout으로 설정한다', async () => {
    const prisma = createPrismaMock();
    const repository = new AssistantPrismaRepository(prisma as unknown as PrismaService);
    const executeRawUnsafe = jest.fn().mockResolvedValue(0);
    const tx = { $executeRawUnsafe: executeRawUnsafe };

    await repository.configureReadOnlyTransaction(tx as never);

    expect(executeRawUnsafe).toHaveBeenNthCalledWith(1, 'SET TRANSACTION READ ONLY');
    expect(executeRawUnsafe).toHaveBeenNthCalledWith(2, "SET LOCAL statement_timeout = '3000ms'");
  });

  it('서버 bandId를 $1에 바인딩하고 외부 LIMIT을 적용한다', async () => {
    const prisma = createPrismaMock();
    const repository = new AssistantPrismaRepository(prisma as unknown as PrismaService);
    const queryRawUnsafe = jest.fn().mockResolvedValue([{ member_count: 3 }]);
    const tx = { $queryRawUnsafe: queryRawUnsafe };

    const result = await repository.executeGeneratedQuery('SELECT COUNT(bm.id)::int AS member_count FROM bands b', ['기타'], 'band-1', tx as never);

    expect(queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM (SELECT COUNT(bm.id)::int AS member_count FROM bands b) AS assistant_result LIMIT 50',
      'band-1',
      '기타',
    );
    expect(result).toEqual([{ member_count: 3 }]);
  });
});
