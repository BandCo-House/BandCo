# 고유 ID 자동 부여 (handle null 제거, 1차)

작성일: 2026-11-10 · 브랜치: `feat/user-handle-generated` (dev 기준) · 선행: #272, 보관 설계 `docs/backend/designs/users/user-handle.md`

## 요구사항

#272는 고유 ID를 정하지 않은 유저를 `handle: null`로 두었다. 이를 바꾼다.

1. 고유 ID가 없는 유저에게 서버가 랜덤 고유 ID를 부여한다. 기존 null 유저와 신규 가입자 모두 해당한다.
2. 랜덤 ID를 받은 유저는 원하는 ID로 바꿀 수 있다.
3. **결정 A (2026-11-10 사용자 확정).** 모든 유저는 계속 7일 쿨다운으로 바꿀 수 있다. 랜덤 ID에서 처음 바꿀 때만 쿨다운에 세지 않는다. 이는 #272 결정 6("처음 설정은 쿨다운 미적용")을 그대로 잇는다.

## 1. 작업 범위

```
신규: prisma/migrations/20261110120000_add_handle_generated/migration.sql
      src/modules/users/util/generate-handle.ts
      src/modules/users/util/generate-handle.spec.ts
수정: prisma/schema.prisma                                   (UserProfile.handleGenerated 추가)
      src/modules/users/repositoreis/user.repository.ts      (시그니처 3개)
      src/modules/users/repositoreis/user.prisma-repository.ts
      src/modules/users/repositoreis/user.prisma-repository.spec.ts
      src/modules/users/types/user-handle.type.ts            (HandleState.handleGenerated)
      src/modules/users/types/user-profile.type.ts           (UserProfileDetail.handleGenerated)
      src/modules/users/users.service.ts                     (가입 2종·탈퇴·changeHandle)
      src/modules/users/users.service.spec.ts
      src/modules/admin/users/repositories/admin-managed-users.repository.ts        (softDeleteUser 인자, isHandleTaken)
      src/modules/admin/users/repositories/admin-managed-users.prisma-repository.ts
      src/modules/admin/users/admin-users.service.ts         (withdrawUser)
      src/modules/admin/users/admin-users.service.spec.ts
      docs/backend/api-docs/users.md                         (#72·프로필 응답)
      docs/backend/designs/users/user-handle.md              (11절 결정 갱신 메모)
```

## 2. 스키마·마이그레이션

```prisma
model UserProfile {
  /// 고유 ID(@handle). 영문 대소문자·숫자·밑줄 4~8자. 정하지 않은 유저는 서버가 랜덤 값을 준다(handleGenerated=true).
  handle          String?   @unique @db.VarChar(8)
  /// 서버가 랜덤으로 준 고유 ID인지. 유저가 직접 바꾸면 false가 되고, 그 첫 변경은 쿨다운에 세지 않는다.
  handleGenerated Boolean   @default(false) @map("handle_generated")
  ...
}
```

`handle`은 이번에 **nullable을 유지**한다. `NOT NULL` 전환은 2차 배포에서 한다(8절).

`migration.sql` (수동 작성, `migrate dev` 사용 안 함):

```sql
ALTER TABLE "user_profiles" ADD COLUMN "handle_generated" BOOLEAN NOT NULL DEFAULT false;

-- 고유 ID가 없는 유저(탈퇴 유저 포함)에게 소문자·숫자 8자 랜덤 ID를 준다. 대소문자 무시로 겹치면 다시 뽑는다.
DO $$
DECLARE
  target RECORD;
  candidate TEXT;
BEGIN
  FOR target IN SELECT "user_id" FROM "user_profiles" WHERE "handle" IS NULL LOOP
    LOOP
      SELECT string_agg(substr('abcdefghijklmnopqrstuvwxyz0123456789', floor(random() * 36)::int + 1, 1), '')
        INTO candidate FROM generate_series(1, 8);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "user_profiles" WHERE lower("handle") = candidate);
    END LOOP;
    UPDATE "user_profiles" SET "handle" = candidate, "handle_generated" = true, "handle_changed_at" = NULL
      WHERE "user_id" = target."user_id";
  END LOOP;
END $$;

-- 앱은 대소문자를 무시해 하나만 쓰게 하지만 기존 유니크 인덱스는 대소문자를 구분한다. DB에서도 막는다.
-- (Prisma 스키마로 표현할 수 없어 이 마이그레이션에만 존재한다. 이후 migrate dev가 DROP INDEX를 만들면 지운다.)
CREATE UNIQUE INDEX "user_profiles_handle_lower_key" ON "user_profiles" (lower("handle"));
```

- 백필한 행의 `handle_changed_at`은 이미 null이다. 처음 설정 전이었으므로 명시해 둔다.
- 대소문자만 다른 기존 handle 쌍이 있으면 인덱스 생성이 실패한다. #272부터 앱이 막아 왔으므로 없어야 정상이다. 배포 전에 읽기 전용 쿼리로 확인하는 방법은 9절 미결 사항에 있다.

## 3. 랜덤 ID 생성 — `util/generate-handle.ts`

```typescript
/** 랜덤 고유 ID에 쓰는 글자. HANDLE_PATTERN의 부분집합이며, 대소문자 무시 중복을 피하려고 소문자만 쓴다 */
const GENERATED_HANDLE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
/** 랜덤 고유 ID 길이. 36^8 ≈ 2.8조라 겹칠 일이 거의 없다 */
const GENERATED_HANDLE_LENGTH = 8;
/** 겹친 후보를 다시 뽑는 최대 횟수 */
const GENERATED_HANDLE_MAX_ATTEMPTS = 5;

/** crypto.randomInt로 소문자·숫자 8자 고유 ID 후보를 만든다 */
export function generateRandomHandle(): string;

/**
 * 쓰이지 않은 랜덤 고유 ID를 고른다. 트랜잭션 안에서는 유니크 위반 후 재시도가 불가능해(Postgres가 트랜잭션을 중단)
 * 저장 전에 조회로 확인한다. 최대 횟수 안에 못 고르면 Error(500)를 던진다.
 */
export async function pickAvailableHandle(isTaken: (handle: string) => Promise<boolean>): Promise<string>;
```

조회와 저장 사이에 같은 후보가 끼어드는 경우는 남는다. 그때는 DB 유니크 인덱스가 P2002로 막는다. 그런데 가입 경로는 P2002를 "이미 존재하는 이메일"로 바꾸므로 메시지가 틀린다. 이 경우는 수조 분의 일 수준이라 별도 처리를 하지 않는다.

## 4. Repository 인터페이스 변경

### `UsersRepository`

```typescript
/** 이메일 유저와 프로필을 만든다. handle은 서버가 고른 랜덤 고유 ID로 저장하고 handleGenerated=true로 표시한다 */
createUserWithEmail(email: string, passwordHash: string, nickname: string, handle: string, tx?): Promise<User>;
/** OAuth 유저·프로필·연결을 만든다. handle 처리는 위와 같다 */
createUserWithOAuth(input: CreateOAuthUserInput, handle: string, tx?): Promise<User>;
/** 탈퇴 처리. 원래 고유 ID를 풀도록 replacementHandle(랜덤)로 바꾸고 handleGenerated=true, handleChangedAt=null로 둔다 */
softDeleteUser(userId: string, replacementHandle: string, tx?): Promise<DeleteUserResult | null>;
```

- `findHandleState`가 `handleGenerated`도 돌려준다(`HandleState` 타입에 추가).
- `updateHandle`이 저장할 때 `handleGenerated: false`도 함께 쓴다.
- `findUserProfileById`의 profile에 `handleGenerated`를 담는다.

### `AdminManagedUsersRepository`

```typescript
softDeleteUser(userId: string, deletedAt: Date, replacementHandle: string, tx?): Promise<void>;
/** 대소문자 무시로 이미 쓰이는 고유 ID인지 확인한다 */
isHandleTaken(handle: string, tx?): Promise<boolean>;
```

`restoreUser`는 바꾸지 않는다. 탈퇴할 때 이미 랜덤 ID로 바뀌었고, 옛 탈퇴 유저는 마이그레이션이 채운다. 그래서 복구된 유저도 랜덤 ID(handleGenerated=true)를 갖고, 바로 한 번 쿨다운 없이 바꿀 수 있다.

## 5. Service 비즈니스 규칙

```
createUserWithEmail(email, passwordHash, nickname, tx?):
1. 이메일 중복 → BadRequestException (기존)
2. handle = pickAvailableHandle(h => findUserIdByHandle(h, tx) !== null)
3. createUserWithEmail(..., handle, tx), P2002 → BadRequestException (기존)

createUserWithGoogle(input, tx?): 2·3과 같은 방식으로 handle을 넘긴다.

deleteUser(userId, tx?):
1. replacement = pickAvailableHandle(...)
2. softDeleteUser(userId, replacement, tx) → null이면 NotFoundException (기존)

changeHandle(userId, handle, tx?):  — 바뀌는 곳은 첫 설정 판정뿐
- isFirstSet = state.handleGenerated   (기존: state.handle === null)
- handle이 아직 null인 유저(1차 배포 사이 예외 상황)는 isFirstSet로 본다: state.handleGenerated || state.handle === null
- 나머지(동일 값 조기 반환, 쿨다운 확인, 중복 확인, 낙관적 잠금)는 그대로
- 지금 값과 같은 값을 보내면 조기 반환하므로 handleGenerated는 true로 남는다(아무것도 바꾸지 않음)

AdminUsersService.withdrawUser(actor, userId, reason, tx?):
- softDeleteUser 전에 replacement = pickAvailableHandle(h => managedUsersRepository.isHandleTaken(h, client))
```

`getUserProfile`의 응답 변환(`toUserProfileResult`)은 `handleGenerated`를 그대로 통과시킨다. 이 값은 handle과 마찬가지로 조회자와 상관없이 담는다. 랜덤 ID라는 사실은 민감 정보가 아니고, 프론트가 다른 사람 화면에서 표시를 달리할 수도 있기 때문이다.

## 6. API 번호·응답 변경

- **#72 `PATCH /users/:userId/handle`:** 요청과 응답 형태는 그대로다. "처음 설정"의 의미만 "랜덤 ID에서의 첫 변경"으로 바뀐다.
- **유저 프로필 조회(`GET /users/:userId`):** `profile.handleGenerated: boolean`을 추가한다. `handle`은 타입상 `string | null`을 유지한다(2차에서 좁힘).
- **새 API는 없다.** 다른 모듈 응답 타입도 그대로다.

## 7. 트랜잭션 경계

- 가입은 `auth.service`가 연 tx 안에서 돈다. 후보 조회와 생성이 같은 tx를 쓴다.
- 탈퇴(본인)는 `tx?`를 그대로 넘긴다. 어드민 탈퇴는 기존 `run(client)` 안에서 조회한다.
- tx 안에서는 재시도를 P2002 캐치가 아니라 사전 조회로 한다(3절).

## 8. 배포 순서 (2단계)

1. **1차 (이번 PR).** 컬럼 추가, 백필, lower 인덱스, 생성 코드를 함께 배포한다. 파이프라인이 `migrate deploy` 후 새 코드를 띄우는 사이에 옛 코드로 가입하면 handle이 null인 유저가 생길 수 있다. 그래서 changeHandle이 null도 첫 설정으로 받는다.
2. **2차 (후속 PR).** 남은 null을 다시 백필한 뒤 `ALTER COLUMN "handle" SET NOT NULL`을 적용한다. 각 모듈 타입을 `handle: string`으로 좁히고, changeHandle의 `|| state.handle === null`을 지운다. `prisma/seed.ts`의 프로필 upsert 3건에 handle을 넣는다(QA 지적, 1차에서는 nullable이라 그대로 둠). FE에는 non-null로 좁혀도 된다고 알린다.

## 구현 반영 메모 (2026-11-10 QA 후)

- 마이그레이션에서 lower 인덱스를 백필보다 먼저 만든다. 백필의 중복 검사가 인덱스를 타고, 대소문자 중복이 있으면 백필 전에 바로 실패한다.
- 랜덤 ID를 대소문자만 바꾸는 것(`ab12cd34` → `AB12CD34`)도 첫 변경으로 처리된다. 이것으로 무료 변경 1회를 쓰게 된다. 설계대로이며, FE 안내에 반영할지는 FE가 정한다.
- `findUserIdByHandle`·`isHandleTaken`은 insensitive equals(ILIKE)라 lower 인덱스를 타지 않는다. 가입·탈퇴마다 한 번 돌지만 지금 규모에서는 무시한다.

## 9. 테스트 계획

| 대상 | 케이스 |
| --- | --- |
| generate-handle | 결과가 `^[a-z0-9]{8}$`이고 HANDLE_PATTERN을 통과 / 첫 후보가 쓰이고 있으면 다시 뽑음 / 5회 모두 쓰이고 있으면 Error |
| createUserWithEmail | happy path에서 repository에 8자 handle을 넘김 / 이메일 중복 BadRequest(기존) / 외부 tx를 findUserIdByHandle·create에 전달 |
| createUserWithGoogle | handle을 넘김 / 외부 tx 전달 |
| deleteUser | 랜덤 replacement를 넘김 / 없으면 NotFoundException(기존) / tx 전달 |
| changeHandle | handleGenerated=true에서 변경 → changedAt null(쿨다운 미기록) / handleGenerated=false, 쿨다운 끝 → changedAt=now / 쿨다운 중 → BadRequest(기존) / handle null → 첫 설정 |
| getUserProfile | handleGenerated가 응답에 담김 |
| users prisma-repository | create 2종이 handle·handleGenerated=true로 저장 / softDeleteUser가 replacement·true·null 저장 / updateHandle이 handleGenerated=false 저장 |
| AdminUsersService.withdrawUser | softDeleteUser에 replacement 전달, isHandleTaken에 같은 client 전달 |

ForbiddenException 경로는 이번 변경과 상관없다(권한은 컨트롤러 가드에서 기존대로 처리).

## 10. 미결 사항

- **배포 전 확인(사용자).** 운영 DB에 대소문자만 다른 handle 쌍이 있으면 lower 인덱스 생성이 실패한다. 다음 읽기 전용 쿼리로 확인할 수 있다: `SELECT lower(handle), count(*) FROM user_profiles WHERE handle IS NOT NULL GROUP BY 1 HAVING count(*) > 1;`
- **FE.** `handleGenerated`로 "임시 ID" 안내를 띄울지는 FE가 정한다. 백엔드는 필드만 제공한다.
