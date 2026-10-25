# 유저 고유 ID(handle) 도입 설계

작성일: 2026-10-17 · 결정 확정·구현: 2026-10-19 · 브랜치: `feat/user-handle`

> 구현 후 보관본이다. 최종 결정은 11절, 설계와 달라진 구현 세부는 13절에 있다. 본문의 "결정 N"은 11절 항목 번호다.

Discord의 `@devjun`처럼 유저마다 하나뿐인 문자열 ID를 둔다. 기존 유저는 `null`로 두고 마이페이지에서 직접 정한다.

## 요구사항 정리

| # | 요구 | 설계 반영 |
|---|------|-----------|
| R1 | 유저마다 고유 ID를 설정할 수 있다 | `user_profiles.handle` 컬럼 신규, 전용 변경 API `#72 PATCH /users/:userId/handle` |
| R2 | 유저가 조회되는 모든 API에서 고유 ID도 반환 | 닉네임을 내려주는 21개 응답 타입 전부에 `handle: string \| null` 추가 |
| R3 | 한 번 수정하면 7일간 수정 불가 | `user_profiles.handle_changed_at` 기록, Service에서 쿨다운 검사 |
| R4 | 기존 유저는 null, 본인이 직접 설정 | 컬럼 nullable, 백필 없음 |
| R5 | 마이페이지용 중복 확인 API | `#71 GET /users/handles/availability?handle=` |
| R6 | unique 제약조건 | `@unique` + 앱에서 대소문자 무시 중복 검사 (결정 1) |
| R7 | `a-z A-Z 0-9 _`, 4~8자 | `HANDLE_PATTERN = /^[A-Za-z0-9_]{4,8}$/`, DB `VARCHAR(8)` |
| R8 | 유저 검색 API에서 nickname OR email OR 고유 ID 검색 | `#4 GET /users`에 통합 검색어 `where__keyword__contain` 추가. 닉네임·고유 ID는 부분 일치, 이메일은 완전 일치(결정 2). 기존 `where__nickname__contain`은 프론트가 쓰고 있어 유지 |
| R9 | 닉네임 최대 20자 제약 | `user_profiles.nickname VARCHAR(255) → VARCHAR(20)` + DTO `@MaxLength(20)` |

용어: 요청·응답 필드명은 `handle`로 통일한다(`id`는 이미 UUID, `username`은 닉네임과 혼동). 사용자 노출 문구는 "고유 ID".

위치: `users`가 아니라 **`user_profiles`** 에 둔다(2026-10-19 논의). `users`는 계정·인증 데이터(email, passwordHash, status), `user_profiles`는 본인이 고르는 공개 페르소나(nickname, selfDescription, avatarUrl)이고 handle은 로그인에 쓰이지 않는 공개 식별자라 후자다. 모든 유저 응답이 이미 `profile: { select: { nickname } }`를 끌고 오므로 수정 지점도 그 select 한 줄로 좁아진다.

---

## 1. 작업 범위

### 스키마·마이그레이션

```text
수정: prisma/schema.prisma
  - UserProfile.handle           String?   @unique @db.VarChar(8)
  - UserProfile.handleChangedAt  DateTime? @map("handle_changed_at") @db.Timestamptz(6)
  - UserProfile.nickname         @db.VarChar(255) → @db.VarChar(20)
신규: prisma/migrations/20261017150000_add_user_handle_and_nickname_limit/migration.sql
```

### users 모듈

```text
신규: src/modules/users/dto/change-handle.dto.ts            (HANDLE_PATTERN·메시지 상수 + ChangeHandleDto)
      src/modules/users/dto/check-handle-query.dto.ts       (CheckHandleQueryDto)
      src/modules/users/types/user-handle.type.ts           (HandleAvailabilityResult, ChangeHandleResult)
      src/modules/users/util/handle-cooldown.ts             (쿨다운 상수·다음 변경 가능 시각 계산 순수 함수)
      src/modules/users/util/handle-cooldown.spec.ts

수정: src/modules/users/repositoreis/user.repository.ts      (findUserIdByHandle, findHandleState, updateHandle 추가)
      src/modules/users/repositoreis/user.prisma-repository.ts
        - 위 3개 구현
        - userListInclude/mapUserListItem: handle 포함
        - findUsers: where__keyword__contain → nickname/handle/email OR 조건 보정, next 경로에 파라미터 전달
        - findUserProfileById: profile.handle, profile.handleChangedAt 포함
        - softDeleteUser: profile.handle 해제 (결정 3)
      src/modules/users/users.service.ts                    (checkHandleAvailability, changeHandle 추가, getUserProfile 마스킹)
      src/modules/users/users.service.spec.ts
      src/modules/users/users.controller.ts                 (#71, #72 핸들러)
      src/modules/users/dto/get-users-query.dto.ts          (where__keyword__contain)
      src/modules/users/dto/update-user-profile.dto.ts      (nickname @MaxLength(20))
      src/modules/users/types/user-list.type.ts             (UserListItem.handle)
      src/modules/users/types/user-profile.type.ts          (UserProfileDetail.handle, handleChangeableAt)
      src/auth/dto/register-email.dto.ts                    (nickname @MaxLength(255) → 20)
      src/auth/auth.service.ts                              (Google 가입 닉네임 20자로 잘라 저장 — VARCHAR(20) 위반 방지)
```

### 유저가 조회되는 다른 모듈 (R2) — 타입에 `handle` 추가 + Prisma select/매핑 수정

| 모듈 | 타입 파일 | 매핑 위치(prisma-repository) |
|------|-----------|------------------------------|
| bands | `band-member-list.type.ts`, `band-search-result.type.ts`(bandMaster), `received-band-invitation-list.type.ts`(inviter), `sent-band-invitation-list.type.ts`(invitee), `band-join-request-list.type.ts`(requester) | `bands.prisma-repository.ts` select 6곳(593·665·909·983·1039·1166) + 매핑 5곳(1717·1759·1864·1907·1965) |
| bandspaces | `bandspace-detail.type.ts`(members) | `bandspaces.prisma-repository.ts` 52·270·433 |
| notifications | `notification-list-item.type.ts`(inviter) | `notifications.prisma-repository.ts` 169·186 |
| schedules | `schedule-list-item.type.ts`, `schedule-detail.type.ts`(participants) | `schedules.prisma-repository.ts` 199·230·521·555 |
| schedule-polls | `schedule-poll.type.ts`(voters) | `schedule-polls.prisma-repository.ts` 221 |
| teams | `get-band-teams-result.type.ts`(leader), `get-team-members-result.type.ts` | `teams.prisma-repository.ts` select/매핑 ~12곳 |
| admin | `admin-user.type.ts`, `admin-band.type.ts`(master·members·joinRequests·invitations), `admin-report.type.ts`(reporter·reported), `admin-dashboard.type.ts`(identity) | 각 admin `*.prisma-repository.ts`; `admin-managed-users` 키워드 검색 OR에 `handle contains` 추가 |

`handle`은 `user_profiles` 컬럼이므로 기존 `profile: { select: { nickname, ... } }` 안에 `handle: true`를 더하는 패턴이 반복된다. 값은 `profile?.handle ?? null` (nickname이 `profile?.nickname ?? ''`로 읽히는 것과 같은 자리).

제외: `assistant` 모듈(자연어 조회). `users` 테이블 컬럼 권한(`assistant_reader` GRANT)과 `sql-catalog.ts`에 handle을 넣지 않는다 — 요청 범위 밖이고, 넣으면 `sql-catalog.spec.ts`가 마이그레이션과 대조하므로 별도 마이그레이션이 필요하다.

### 문서

```text
수정: docs/backend/api-docs/users.md     (#1·#5 닉네임 20자, #3 응답, #4 쿼리·응답, #71·#72 신규)
      docs/backend/api-docs/band.md, band-invitation.md, band-join-request.md, bandspaces.md,
      schedules.md, schedule-polls.md, teams.md, notification.md, admin.md  (응답 예시에 handle 추가)
보관: docs/backend/designs/users/user-handle.md  (QA 통과 후 이 문서 이동)
```

---

## 2. 스키마 설계

```prisma
model UserProfile {
  userId          String    @id @map("user_id") @db.Uuid
  nickname        String    @db.VarChar(20)   // 255 → 20
  /// 유저가 직접 정하는 고유 ID(@handle). 영문 대소문자·숫자·밑줄 4~8자. 기존 유저는 null로 시작한다.
  handle          String?   @unique @db.VarChar(8)
  /// 고유 ID 쿨다운 기준 시각. 이 시각 + 7일 전에는 다시 바꿀 수 없다. 처음 설정은 기록하지 않는다(결정 6).
  handleChangedAt DateTime? @map("handle_changed_at") @db.Timestamptz(6)
  selfDescription String?   @map("self_description")
  avatarUrl       String?   @map("avatar_url")
  updatedAt       DateTime? @map("updated_at") @db.Timestamptz(6)
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}
```

`User` 모델은 바꾸지 않는다.

마이그레이션 SQL (초안) — `user_profiles` 한 테이블만 건드린다:

```sql
-- 유저 고유 ID(@handle)와 마지막 변경 시각. 기존 유저는 null로 두고 본인이 설정한다.
ALTER TABLE "user_profiles" ADD COLUMN "handle" VARCHAR(8);
ALTER TABLE "user_profiles" ADD COLUMN "handle_changed_at" TIMESTAMPTZ(6);
CREATE UNIQUE INDEX "user_profiles_handle_key" ON "user_profiles"("handle");

-- 닉네임을 20자로 제한한다. 초과하는 기존 값은 앞 20자만 남긴다.
UPDATE "user_profiles" SET "nickname" = left("nickname", 20) WHERE char_length("nickname") > 20;
ALTER TABLE "user_profiles" ALTER COLUMN "nickname" TYPE VARCHAR(20);
```

- `User.email`과 같은 nullable unique 패턴이다. Postgres 유니크 인덱스는 NULL을 여러 개 허용하므로 미설정 유저가 아무리 많아도 충돌하지 않는다.
- 프로필 행은 이메일 가입(`createUserWithEmail`)·Google 가입(`createUserWithOAuth`) 모두 유저와 같은 트랜잭션에서 만들므로 "프로필이 없어 handle을 못 넣는" 유저는 없다. 타입상 `profile`이 nullable인 것은 nickname과 같은 방식(`?.`)으로 읽는다.
- `assistant_reader` 역할의 `user_profiles` 컬럼 GRANT 목록(nickname, self_description, updated_at)에는 넣지 않는다 — 자연어 조회 범위 밖(1절 참고).
- 닉네임 `UPDATE`는 20자를 넘는 기존 닉네임을 안내 없이 앞 20자로 자른다(결정 4: 사전 확인 없이 진행). 0건이면 아무 행도 바꾸지 않고 지나간다.
- 적용은 기존대로 main 배포 파이프라인의 `migrate deploy`로만 한다.

---

## 3. 타입·DTO 정의

### `dto/change-handle.dto.ts`

```typescript
/** 고유 ID 형식. DB VARCHAR(8)과 맞춘다. */
export const HANDLE_PATTERN = /^[A-Za-z0-9_]{4,8}$/;
export const HANDLE_PATTERN_MESSAGE = '고유 ID는 영문 대소문자·숫자·언더바(_)만 사용해 4~8자로 입력해 주세요.';

export class ChangeHandleDto {
  @ApiProperty({ description: '고유 ID (영문 대소문자·숫자·_ 4~8자)', example: 'devjun' })
  @IsString({ message: stringValidationMessage })
  @Matches(HANDLE_PATTERN, { message: HANDLE_PATTERN_MESSAGE })
  handle!: string;
}
```

### `dto/check-handle-query.dto.ts`

```typescript
export class CheckHandleQueryDto {
  @ApiProperty({ description: '확인할 고유 ID', example: 'devjun' })
  @IsString({ message: stringValidationMessage })
  @Matches(HANDLE_PATTERN, { message: HANDLE_PATTERN_MESSAGE })
  handle!: string;
}
```

형식이 틀리면 400으로 끝나므로 마이페이지는 "형식 오류"와 "중복"을 구분해 보여줄 수 있다.

### `dto/get-users-query.dto.ts` 추가 필드

```typescript
@ApiPropertyOptional({ description: '통합 검색어. 닉네임·고유 ID 부분 일치 또는 이메일 완전 일치(모두 대소문자 무시)', example: 'devjun' })
@Transform(normalizeOptionalStringValue)
@IsOptional()
@IsString({ message: stringValidationMessage })
where__keyword__contain?: string;
```

기존 `where__nickname__contain`은 그대로 둔다(프론트 초대 검색이 사용 중). 두 파라미터가 함께 오면 AND로 겹친다. 프론트가 `where__keyword__contain`으로 옮긴 뒤 닉네임 전용 파라미터를 없앨지는 후속 결정.

### 닉네임 20자

- `UpdateProfileDto.nickname`: `@MaxLength(20, { message: lengthValidationMessage })` 추가 (`@MinLength`은 기존대로 없음)
- `RegisterEmailDto.nickname`: `@MaxLength(255)` → `@MaxLength(20)`

### `types/user-handle.type.ts`

```typescript
/** #71 중복 확인 응답 */
export interface HandleAvailabilityResult {
  handle: string;
  available: boolean;
}

/** #72 변경 응답 */
export interface ChangeHandleResult {
  userId: string;
  handle: string;
  /** 쿨다운 기준 시각. 처음 설정은 기록하지 않아 null이다(결정 6) */
  handleChangedAt: string | null;
  /** 다음 변경 가능 시각(ISO). handleChangedAt + 7일, 처음 설정 직후는 바로 바꿀 수 있어 null */
  handleChangeableAt: string | null;
}

/** updateHandle 입력. currentHandle은 낙관적 잠금용으로, 읽은 뒤 다른 요청이 먼저 바꿨으면 갱신하지 않는다 */
export interface UpdateHandleInput {
  currentHandle: string | null;
  newHandle: string;
  /** 처음 설정이면 null(기록 안 함), 그 외에는 변경 시각 */
  changedAt: Date | null;
}
```

### 기존 타입 변경

```typescript
// types/user-profile.type.ts — UserProfileUserDetail(user 블록)은 변경 없음
export interface UserProfileDetail {
  nickname: string;
  handle: string | null;               // 추가. 누구나 볼 수 있다
  /** 다음 변경 가능 시각. 본인 조회이면서 쿨다운 중일 때만 값이 있고, 그 외(타인 조회·미설정·쿨다운 종료)는 null */
  handleChangeableAt: string | null;   // 추가
  selfDescription: string | null;
  avatarUrl: string | null;
  profileMusic: ProfileMusicTrack | null;
}

// types/user-list.type.ts
export interface UserListItem { id; handle: string | null; nickname; ... }   // 추가
```

그 외 R2 대상 타입은 `nickname` 옆에 `handle: string | null` 한 줄씩 추가한다.

---

## 4. Repository 인터페이스 변경

```typescript
/** 고유 ID가 같은(대소문자 무시) 유저의 id를 돌려준다. 탈퇴 유저가 해제하지 않은 값도 충돌이므로 deletedAt 조건을 걸지 않는다. */
findUserIdByHandle(handle: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;

/** 쿨다운 판정에 필요한 현재 고유 ID와 마지막 변경 시각. 탈퇴 유저면 null */
findHandleState(userId: string, tx?: Prisma.TransactionClient): Promise<{ handle: string | null; handleChangedAt: Date | null } | null>;

/**
 * 고유 ID와 변경 시각을 저장한다. 현재 값이 currentHandle과 다르면(읽은 뒤 다른 요청이 먼저 바꿈) 건드리지 않고 false를 돌려준다.
 * 동시 요청 두 건이 모두 쿨다운 검사를 통과하는 경쟁을 이 조건 하나로 막는다.
 * 유니크 위반(P2002)은 그대로 던진다. Service가 400으로 바꾼다.
 */
updateHandle(userId: string, input: UpdateHandleInput, tx?: Prisma.TransactionClient): Promise<boolean>;
```

구현 메모:

- `findUserIdByHandle`: `userProfile.findFirst({ where: { handle: { equals, mode: 'insensitive' } }, select: { userId } })` → `{ id: userId }`
- `findHandleState`: `userProfile.findFirst({ where: { userId, user: { deletedAt: null } }, select: { handle, handleChangedAt } })`
- `updateHandle`: `userProfile.updateMany({ where: { userId, handle: currentHandle, user: { deletedAt: null } }, data: { handle: newHandle, handleChangedAt: changedAt } })` → `count === 1`
  - 모든 변경은 handle 문자열을 바꾸므로(같은 값은 Service가 먼저 걸러냄), "handle이 읽은 값 그대로"이면 그 사이 아무 변경도 없었다는 뜻이다. 쿨다운 시각 조건을 따로 걸 필요가 없다.
  - 처음 설정은 `changedAt: null`이라 `handleChangedAt`이 null로 유지되고, 다음 한 번의 변경이 쿨다운 없이 통과한다(결정 6).
- `findUsers`: 파서 결과 `where.keyword`를 지우고 다음 OR로 바꾼다. `buildNextPath`에 `where__keyword__contain` 전달.
  ```typescript
  where.OR = [
    { profile: { nickname: { contains: keyword, mode: 'insensitive' } } },
    { profile: { handle: { contains: keyword, mode: 'insensitive' } } },
    { email: { equals: keyword, mode: 'insensitive' } },
  ];
  ```
  커서 조건이 이미 `where.AND`를 쓰므로 OR와 충돌하지 않는다. `where__nickname__contain`(기존 `where.profile.nickname`)과 함께 오면 AND로 겹친다.
- `softDeleteUser`: 기존 `user.update`의 `data`에 `profile: { update: { handle: null, handleChangedAt: null } }`를 추가해 같은 문장에서 해제한다 (결정 3). 프로필이 없는 유저는 없지만 Prisma 중첩 update는 대상이 없으면 P2025를 내므로, 그 경우를 방어하려면 `updateMany`로 바꾼다.

---

## 5. Service 비즈니스 규칙

### `util/handle-cooldown.ts`

```typescript
export const HANDLE_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/** 마지막 변경 시각으로부터 다음 변경 가능 시각. 아직 한 번도 안 바꿨거나 쿨다운이 끝났으면 null */
export function getHandleChangeableAt(handleChangedAt: Date | null, now: Date): Date | null
```

### `checkHandleAvailability(handle, viewerUserId, tx?)` → `HandleAvailabilityResult`

```text
1. usersRepository.findUserIdByHandle(handle, tx)
2. 없음 → available: true
3. 있음 && owner.id === viewerUserId → available: true   (마이페이지에서 지금 값 그대로 저장해도 통과)
4. 그 외 → available: false
예외: 없음 (형식 오류는 DTO 400)
```

### `changeHandle(userId, handle, tx?)` → `ChangeHandleResult`

```text
1. state = findHandleState(userId, tx) → null이면 NotFoundException('존재하지 않는 유저입니다.')
2. state.handle === handle (완전 일치) → 변경 없이 현재 상태로 ChangeHandleResult 반환 (쿨다운 소모 안 함)
3. changeableAt = getHandleChangeableAt(state.handleChangedAt, now)
   changeableAt !== null → BadRequestException('고유 ID는 7일에 한 번만 변경할 수 있습니다.')
   (다음 변경 가능 시각은 메시지에 넣지 않는다. 프론트가 프로필 조회의 handleChangeableAt으로 표시한다. 결정 5)
4. owner = findUserIdByHandle(handle, tx); owner && owner.id !== userId → BadRequestException('이미 사용 중인 고유 ID입니다.')
   (대소문자만 다른 본인 값 'devjun' → 'DevJun'은 통과해 변경으로 처리. 결정 1)
5. isFirstSet = state.handle === null
   changedAt = isFirstSet ? null : now          (처음 설정은 쿨다운에 세지 않는다. 결정 6)
6. updated = updateHandle(userId, { currentHandle: state.handle, newHandle: handle, changedAt }, tx)
   - P2002 → BadRequestException('이미 사용 중인 고유 ID입니다.')   (4와 6 사이 경쟁)
   - false → BadRequestException('고유 ID가 방금 다른 요청으로 변경되었습니다. 다시 시도해 주세요.')   (동시 변경 경쟁 또는 그 사이 탈퇴)
7. { userId, handle, handleChangedAt: changedAt, handleChangeableAt: changedAt ? changedAt + 7일 : null } 반환
```

흐름 예시 (결정 6):

| 시점 | 요청 | 결과 | handleChangedAt |
|------|------|------|-----------------|
| 10/19 | null → `devjnu` (첫 설정) | 성공 | null |
| 10/19 | `devjnu` → `devjun` (오타 수정) | 성공 | 10/19 |
| 10/21 | `devjun` → `junny` | 400 쿨다운 | 10/19 |
| 10/26 | `devjun` → `junny` | 성공 | 10/26 |

Service는 `PrismaService`를 새로 주입하지 않는다. 6번이 조건부 단일 UPDATE라 자체 트랜잭션 없이도 원자적이고, 기존 패턴대로 `tx?`만 그대로 넘긴다.

### `getUserProfile(userId, viewerUserId, tx?)` 변경

```text
- repository가 profile.handle, profile.handleChangedAt(Date|null)을 돌려주면 Service가
  profile.handleChangeableAt = viewer === userId ? getHandleChangeableAt(handleChangedAt, now) : null 로 바꿔 넣는다 (`profile`이 null이면 그대로 null).
- handle 자체는 타인 조회에서도 유지한다 (email과 달리 공개 식별자).
```

### 기타

- `auth.service.ts` Google 신규 가입: `nickname = (googleUser.name ?? local-part).slice(0, 20)` — 20자 초과 이름으로 가입이 DB 오류로 실패하지 않게 한다.
- `updateUserProfile`은 변경 없음 (handle은 전용 API로만 바꾼다. `personalInfo`에 넣지 않는 이유: 쿨다운·중복 규칙과 응답이 분리돼 테스트와 프론트 처리가 단순해진다).

---

## 6. API 번호 및 Swagger

| 번호 | 메서드 | 경로 | 비고 |
|------|--------|------|------|
| #71 | GET | `/users/handles/availability?handle=` | 신규 (users.md 최대 #70 + 1). `:userId` 라우트보다 위에 선언 |
| #72 | PATCH | `/users/:userId/handle` | 신규 |
| #4 | GET | `/users` | 수정: `where__keyword__contain`(닉네임·고유 ID·이메일), 응답 `handle` |
| #3 | GET | `/users/:userId/profiles` | 수정: `profile.handle`, `profile.handleChangeableAt` |
| #5 | PATCH | `/users/:userId/profiles` | 수정: 닉네임 20자 |
| #1 | POST | `/auth/register/email` | 수정: 닉네임 20자 |

```typescript
@Get('handles/availability')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth('access-token')
@ApiOperation({ summary: '고유 ID 중복 확인' })
@ApiResponse({ status: 200, description: '확인 성공 (available로 사용 가능 여부 반환, 본인이 쓰는 값이면 true)' })
@ApiResponse({ status: 400, description: '고유 ID 형식 오류 (영문 대소문자·숫자·_ 4~8자)' })
@ApiResponse({ status: 401, description: '인증 실패' })
async checkHandleAvailability(@Req() request, @Query() query: CheckHandleQueryDto): Promise<ApiSuccessResponse<HandleAvailabilityResult>>

@Patch(':userId/handle')
@UseGuards(AccessTokenGuard, SelfUserGuard)
@ApiBearerAuth('access-token')
@ApiOperation({ summary: '고유 ID 변경 (7일에 1회)' })
@ApiParam({ name: 'userId', description: '유저 ID (UUID)', type: String })
@ApiResponse({ status: 200, description: '고유 ID 변경 성공' })
@ApiResponse({ status: 400, description: '형식 오류, 이미 사용 중인 고유 ID, 7일 쿨다운 미경과' })
@ApiResponse({ status: 401, description: '인증 실패' })
@ApiResponse({ status: 403, description: '본인 고유 ID만 변경 가능' })
@ApiResponse({ status: 404, description: '존재하지 않는 유저' })
async changeHandle(@Param('userId', ParseUUIDPipe) userId: string, @Body() dto: ChangeHandleDto): Promise<ApiSuccessResponse<ChangeHandleResult>>
```

인증을 #71에도 거는 이유: 비로그인 중복 확인은 고유 ID 전수 열거 창구가 된다.

응답 예시:

```json
// #71
{ "status": "success", "error": null, "message": "고유 ID 확인 성공", "data": { "handle": "devjun", "available": true } }

// #72 처음 설정 (바로 한 번 더 바꿀 수 있음)
{ "status": "success", "error": null, "message": "고유 ID 변경 성공",
  "data": { "userId": "uuid", "handle": "devjnu", "handleChangedAt": null, "handleChangeableAt": null } }

// #72 두 번째 이후 변경
{ "status": "success", "error": null, "message": "고유 ID 변경 성공",
  "data": { "userId": "uuid", "handle": "devjun", "handleChangedAt": "2026-10-19T06:00:00.000Z", "handleChangeableAt": "2026-10-26T06:00:00.000Z" } }

// #72 쿨다운 실패
{ "status": "fail", "error": { "code": "BAD_REQUEST", "details": { "statusCode": 400 } },
  "message": "고유 ID는 7일에 한 번만 변경할 수 있습니다.", "data": {} }
```

---

## 7. Soft Delete

- `findHandleState`, `updateHandle`: `user_profiles`에는 `deletedAt`이 없으므로 관계 조건 `user: { deletedAt: null }`로 검사한다 (탈퇴 유저가 변경 못 하게).
- `findUserIdByHandle`: 조건 없음. 탈퇴 유저의 handle이 남아 있으면 유니크 인덱스에 걸리므로 "사용 중"으로 보는 것이 맞다. 결정 3대로 탈퇴 시 해제하므로 자연히 검색되지 않는다.
- `findUsers`: 기존 `deletedAt: null` 유지.

## 8. 트랜잭션 경계

| 메서드 | tx | 이유 |
|--------|:--:|------|
| `checkHandleAvailability` | 전달만 | 단일 조회 |
| `changeHandle` | 전달만 | 쿨다운 경쟁은 `updateHandle`의 낙관적 잠금(현재 handle 일치 조건)이, 중복 경쟁은 유니크 제약(P2002)이 막는다. 새 `$transaction`을 열지 않는다 |
| `getUserProfile` | 전달만 | 기존과 동일 |
| `softDeleteUser` | 기존 | handle 해제는 `user.update`의 중첩 `profile.update`로 같은 문장 안 |

## 9. 테스트 계획

| 대상 | 케이스 | 검증 |
|------|--------|------|
| `getHandleChangeableAt` | null 입력 → null / 7일 미만 → changedAt+7d / 7일 이상 → null | 순수 함수 단위 테스트 |
| `checkHandleAvailability` | 미사용 → true / 타인 사용 → false / 본인 사용 → true / 외부 tx 전달 | Stub 반환값·tx 캡처 |
| `changeHandle` | 처음 설정(handle null) → changedAt null로 저장, 응답 두 시각 모두 null | updateHandle 인자 관찰 |
| `changeHandle` | 처음 설정 직후(handle 있음, changedAt null) 변경 → 쿨다운 없이 성공, changedAt = now, changeableAt = now+7d | Stub |
| `changeHandle` | 유저 없음 → NotFoundException | `findHandleState` null |
| `changeHandle` | 현재 값과 완전 일치 → updateHandle 미호출, 쿨다운 유지 | 호출 관찰 |
| `changeHandle` | 쿨다운 중 → BadRequestException('고유 ID는 7일에 한 번만 변경할 수 있습니다.') | changedAt = now-1d |
| `changeHandle` | 쿨다운 정확히 7일 경과 → 성공 | changedAt = now-7d |
| `changeHandle` | updateHandle에 currentHandle로 읽은 값이 전달됨 | 인자 관찰 |
| `changeHandle` | 타인이 사용 중(대소문자만 다름 포함) → BadRequestException | `findUserIdByHandle` 타인 id |
| `changeHandle` | 본인 값과 대소문자만 다름 → 변경 진행 | owner.id === userId |
| `changeHandle` | updateHandle P2002 → BadRequestException | Stub throw `PrismaClientKnownRequestError` |
| `changeHandle` | updateHandle false → BadRequestException('…다시 시도해 주세요.') | 경쟁 시나리오 |
| `UsersPrismaRepository.softDeleteUser` | 탈퇴 시 handle·handleChangedAt이 null로 해제 | 기존 repository spec에 케이스 추가 |
| `changeHandle` | 외부 tx 전달 | 모든 repository 호출에 같은 tx |
| `getUserProfile` | 본인·쿨다운 중 → handleChangeableAt 값 / 타인 → null, handle은 유지 | 기존 spec 확장 |
| `ChangeHandleDto` / `CheckHandleQueryDto` | 3자·9자·한글·하이픈 → 실패, `dev_jun1` → 통과 | `plainToInstance` + `validate` (testing.md DTO 조건부 테스트) |
| `UpdateProfileDto` / `RegisterEmailDto` | 닉네임 21자 → 실패, 20자 → 통과 | 동일 |
| `UsersPrismaRepository.findUsers` | `where__keyword__contain`이 nickname contains OR handle contains OR email equals로 변환, 기존 `where__nickname__contain`과 AND 결합, 커서 AND 조건과 공존, next 경로에 포함 | 기존 `user.prisma-repository.spec.ts`에 케이스 추가 |

Controller는 테스트하지 않는다. 최종 `sh ./scripts/verify.sh` 통과.

---

## 10. 프론트 영향 (이번 브랜치 범위 밖, 후속 작업 목록)

응답에 필드가 추가되는 것은 zod 스키마가 `.strict()`를 쓰지 않아 깨지지 않는다. 기능을 쓰려면:

- `entities/user/api/user-search-api.ts`, `useUserSearch.ts`, `features/band-create/ui/InviteeSearchModal.tsx`: `where__nickname__contain` 대신 `where__keyword__contain`으로 검색어 전달(닉네임·고유 ID·이메일 한 입력창), 결과에 `@handle` 표시
- `entities/profile/model/schema.ts`: `profileDetailSchema`에 `handle`, `handleChangeableAt` 추가
- `pages/profile.tsx`(마이페이지): 고유 ID 입력 + 중복 확인(#71) + 저장(#72), `handleChangeableAt`이 있으면 비활성화
- `features/profile-update/model/schema.ts`, `features/auth/model/auth.schema.ts`: 닉네임 max 255 → 20
- 멤버·초대·일정 참가자 목록 UI에서 `@handle` 노출(선택), `mocks/*` 갱신

**백엔드 완료 후 할 일:** 이 브랜치가 dev에 머지되면 프론트 검색 파라미터 전환(`where__nickname__contain` → `where__keyword__contain`)을 GitHub 이슈로 올린다(FE 라벨). 프론트 전환이 끝나면 백엔드의 `where__nickname__contain` 제거 여부를 그 이슈에서 함께 정한다.

---

## 11. 결정 사항 (2026-10-19 확정)

1. **대소문자: 같은 ID로 보고 앱에서 막는다.** DB는 `@unique`(대소문자 구분)로 두고, 중복 확인·변경 검사는 `mode: 'insensitive'`로 한다. `devjun`이 있으면 `DevJun`은 "사용 중"으로 거절되고, 표시는 입력한 대로 남는다. 검사와 저장 사이 수 ms 경쟁에서만 대소문자만 다른 두 값이 공존할 수 있으며 이는 감수한다. citext·소문자 정규화 저장은 채택하지 않았다.
2. **이메일 검색: 전체 주소 완전 일치만.** 2026-09-26(#212 후속)의 이메일 부분 검색 제거 결정을 유지한다. 닉네임·고유 ID만 부분 일치다.
3. **탈퇴 시 handle 해제.** `softDeleteUser`에서 `handle`, `handleChangedAt`을 null로 비워 다른 사람이 바로 쓸 수 있게 한다. 탈퇴 직후 다른 사람이 그 ID를 가져갈 수 있는 점은 감수한다. (2026-10-25 리뷰 반영) 어드민 탈퇴(`AdminManagedUsersPrismaRepository.softDeleteUser`)도 같이 비운다. 어드민 복구는 고유 ID를 되돌리지 않으므로 복구된 유저가 다시 정해야 한다(그 사이 다른 사람이 가져갔을 수 있다).
4. **20자 초과 기존 닉네임: 사전 확인 없이 앞 20자로 자른다.** 마이그레이션의 `UPDATE ... left(nickname, 20)`이 처리한다. 해당 유저에게 별도 안내는 하지 않는다.
5. **쿨다운 문구: 메시지는 짧게, 시각은 프론트가 표시.** 에러 메시지는 "고유 ID는 7일에 한 번만 변경할 수 있습니다."로 고정한다. 다음 변경 가능 시각은 프로필 조회 응답의 `profile.handleChangeableAt`과 #72 성공 응답으로 프론트가 포맷해 보여주고, 저장 버튼을 미리 비활성화한다.
6. **처음 설정은 쿨다운에 세지 않는다.** null에서 처음 정할 때는 `handleChangedAt`을 기록하지 않아 직후 한 번 바로 고칠 수 있다. 그 변경부터 7일 제한이 걸린다. 5절의 흐름 예시 참고.

---

## 12. 발견한 기존 결함 (이번 범위 밖)

- `UserProfile.updatedAt`·`BandSpace.updatedAt`에 `@updatedAt`이 없고 DB 기본값·트리거·코드 할당도 없어 항상 NULL이다 → **#271**로 분리. 이 브랜치에서는 손대지 않는다.
- `handleChangedAt`은 쿨다운 규칙이 참조하는 도메인 시각이므로 `@updatedAt`을 붙이지 않고 handle 변경 때만 명시적으로 기록한다. 행 메타데이터 `updatedAt`과 같은 테이블에 두는 것은 `AdminUser.passwordChangedAt`과 같은 기존 패턴이다(2026-10-19 논의).

---

## 13. 구현 반영 메모 (2026-10-19, 설계와 달라진 점)

- **상수 위치.** `HANDLE_PATTERN`·`HANDLE_PATTERN_MESSAGE`·`NICKNAME_MAX_LENGTH`를 `src/modules/users/constants/user-profile.constant.ts`에 모았다. DTO 두 개(#71·#72)와 auth의 회원가입 DTO·Google 가입이 함께 쓰기 때문이다. 쿨다운 상수와 계산은 설계대로 `util/handle-cooldown.ts`.
- **타입.** `HandleState`, `UpdateHandleInput`을 `types/user-handle.type.ts`에 두었다. 프로필 조회는 Repository가 `UserProfileRecord`(쿨다운 기준 시각 `handleChangedAt: Date | null` 포함)를 돌려주고, Service의 `toUserProfileResult`가 이메일 마스킹과 `handleChangeableAt` 계산을 함께 한다. `updateUserProfile`도 같은 변환을 거쳐 본인 응답으로 돌려준다.
- **탈퇴 해제.** `softDeleteUser`가 `handle`과 함께 `handleChangedAt`도 비운다(결정 3). 어드민 탈퇴도 같다.
- **LIKE 이스케이프 (2026-10-25 리뷰 반영).** Prisma는 PostgreSQL에서 `contains`와 insensitive `equals`를 이스케이프 없는 (I)LIKE로 보낸다. 통합 검색어와 `findUserIdByHandle`은 `escapeLikePattern`(`src/common/query`)으로 `\`·`%`·`_`를 이스케이프해, `%`로 이메일을 추측하거나 `dev_`가 `devj`와 충돌하는 일을 막는다.
- **닉네임 길이 (2026-10-25 리뷰 반영).** class-validator `MaxLength`는 서로게이트 쌍·변형 선택자를 빼고 세서 DB `VARCHAR(20)`(코드 포인트)와 어긋난다. DTO는 `nicknameLengthPattern`(`u` 플래그 정규식)으로 검사하고, Google 가입 닉네임은 `Array.from`으로 코드 포인트 단위로 자른다.
- **어드민 밴드 상세.** 대기 초대는 필드명이 `inviteeNickname`이라 같은 규칙으로 `inviteeHandle`을 추가했다. 대기 가입 요청은 `handle`.
- **어드민 대시보드 저장소 상위 유저**에도 `handle`을 담았다(`AdminDashboardUserIdentity`).
- **마이그레이션 이름.** `20261019120000_add_user_handle_and_nickname_limit`.
- **DTO 테스트.** `handle.dto.spec.ts`(두 DTO 형식 공통), `update-user-profile.dto.spec.ts`, `src/auth/dto/register-email.dto.spec.ts`(닉네임 20자).
- **API 명세.** `users.md`에 #71·#72 추가와 #1·#3·#4·#5 갱신. 다른 명세는 응답 예시에 `handle`을 넣고, 공통 규칙은 `api-docs/README.md`에 한 줄로 적었다. `#1` 요청 필드가 문서에 `name`으로 잘못 적혀 있던 것을 `nickname`으로 정정했다.
