import type { UserStatus } from '../../generated/prisma';

export interface SeedUserDefinition {
  id: string;
  email: string;
  status: UserStatus;
}

export interface ExistingSeedUserCandidate {
  id: string;
  email: string | null;
}

interface SeedUserConflictResolutionInput {
  seedUsers: readonly SeedUserDefinition[];
  existingUsers: readonly ExistingSeedUserCandidate[];
}

/**
 * 시드에 고정해 둔 이메일과 같은 값을 가진 기존 사용자 중에서
 * 시드가 기대하는 ID와 다른 사용자만 골라낸다.
 *
 * 이렇게 분리해 두면 로컬 DB에 남아 있는 예전 더미 데이터와
 * 현재 시드 데이터가 충돌할 때 어떤 레코드를 정리해야 하는지
 * 명확하게 검증할 수 있다.
 *
 * @param {SeedUserConflictResolutionInput} input - 시드 사용자와 기존 사용자 목록
 * @returns {string[]} 삭제 대상으로 판단된 기존 사용자 ID 목록
 */
export function getConflictingSeedUserIds(input: SeedUserConflictResolutionInput): string[] {
  const seedUserIdByEmail = new Map<string, string>();

  for (const seedUser of input.seedUsers) {
    seedUserIdByEmail.set(seedUser.email, seedUser.id);
  }

  const conflictingUserIds: string[] = [];

  for (const existingUser of input.existingUsers) {
    if (existingUser.email === null) {
      continue;
    }

    const expectedSeedUserId = seedUserIdByEmail.get(existingUser.email);

    if (expectedSeedUserId === undefined) {
      continue;
    }

    if (expectedSeedUserId === existingUser.id) {
      continue;
    }

    conflictingUserIds.push(existingUser.id);
  }

  return conflictingUserIds;
}
