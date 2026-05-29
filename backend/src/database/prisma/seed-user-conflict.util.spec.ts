import { getConflictingSeedUserIds } from './seed-user-conflict.util';

describe('getConflictingSeedUserIds', () => {
  it('시드 이메일과 같지만 ID가 다른 기존 사용자만 충돌 대상으로 고른다', () => {
    const conflictingUserIds = getConflictingSeedUserIds({
      seedUsers: [
        { id: 'seed-user-1', email: 'minjun@jamplay.local', status: 'ACTIVE' },
        { id: 'seed-user-2', email: 'seoyeon@jamplay.local', status: 'ACTIVE' },
      ],
      existingUsers: [
        { id: 'legacy-user-1', email: 'minjun@jamplay.local' },
        { id: 'seed-user-2', email: 'seoyeon@jamplay.local' },
        { id: 'another-user', email: 'someone@jamplay.local' },
      ],
    });

    expect(conflictingUserIds).toEqual(['legacy-user-1']);
  });

<<<<<<< HEAD
  expect(conflictingUserIds).toStrictEqual(['legacy-user-1']);
});
=======
  it('이메일이 없거나 시드 대상이 아닌 사용자는 충돌 대상에서 제외한다', () => {
    const conflictingUserIds = getConflictingSeedUserIds({
      seedUsers: [{ id: 'seed-user-1', email: 'minjun@jamplay.local', status: 'ACTIVE' }],
      existingUsers: [
        { id: 'user-without-email', email: null },
        { id: 'unrelated-user', email: 'outside@jamplay.local' },
        { id: 'seed-user-1', email: 'minjun@jamplay.local' },
      ],
    });
>>>>>>> 9abaf73 (🔧 fix: node:test → Jest 문법으로 테스트 변환)

    expect(conflictingUserIds).toEqual([]);
  });
<<<<<<< HEAD

  expect(conflictingUserIds).toStrictEqual([]);
=======
>>>>>>> 9abaf73 (🔧 fix: node:test → Jest 문법으로 테스트 변환)
});
