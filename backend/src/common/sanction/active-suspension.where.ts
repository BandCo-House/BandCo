import type { Prisma } from 'src/generated/prisma';

/**
 * 지금 효력이 있는 이용 정지 제재 조건.
 * 철회되지 않았고 종료 시각이 없거나(영구) 아직 지나지 않은 SUSPENSION이다.
 * 인증·어드민 회원 필터·대시보드가 같은 기준을 써야 숫자와 실제 차단이 어긋나지 않는다.
 *
 * @param {Date} now - 판정 기준 시각
 * @returns {Prisma.UserSanctionWhereInput} Prisma where 조건
 */
export function buildActiveSuspensionWhere(now: Date): Prisma.UserSanctionWhereInput {
  return {
    type: 'SUSPENSION',
    revokedAt: null,
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
  };
}
