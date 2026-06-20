# 합주 공간 관리 모듈 설계

> 작성일: 2026-05-29
> API 명세: `docs/backend/api-docs/bandspaces.md`
> 스키마 기준: `prisma/schema.prisma`

---

## 핵심 결정 사항 요약

- 라우트 경로 `spaces/:spaceId` → `bandspaces/:bandspaceId` 전체 통일
- `BandSpace` soft delete (deletedAt 필드 있음) / `SpaceMember` hard delete (deletedAt 필드 없음)
- PATCH 패턴: 전달된 필드만 업데이트 (updateBandSpace)
- 알림 전송: Repository가 알림용 메타데이터(spaceName, userId 등)를 함께 반환, Service에서 독립 전송
- team 도메인 MVP 제외 — `#29` 응답에서 teams 배열 제거

---

## 1. 작업 범위

### 신규

```
src/modules/spaces/
├── dto/
│   ├── update-band-space.dto.ts
│   └── update-space-member-role.dto.ts
└── types/
    ├── delete-band-space-result.type.ts
    ├── remove-space-member-result.type.ts
    ├── update-band-space-result.type.ts
    └── update-space-member-role-result.type.ts
```

### 수정

```
src/modules/spaces/spaces.controller.ts       라우트 경로 통일 + 신규 엔드포인트 4개
src/modules/spaces/spaces.service.ts          알림 이벤트 연동 + 신규 메서드 4개
src/modules/spaces/spaces.service.spec.ts     신규 테스트 8개 추가
src/modules/spaces/spaces.module.ts           NotificationsModule import 추가
src/modules/spaces/repositories/
  spaces.repository.ts                        인터페이스 확장 (5개 메서드 + 내부 반환 타입 3개)
  spaces.prisma-repository.ts                 구현 확장
src/modules/spaces/types/
  add-space-member-result.type.ts             userId 필드 추가 (API 명세 반영)
```

---

## 2. Repository 인터페이스

파일: `src/modules/spaces/repositories/spaces.repository.ts`

### 내부 반환 타입 (알림 전송용 메타데이터)

```typescript
/** spaceName은 알림 전송용이며 API 응답에는 포함되지 않는다. */
interface AddSpaceMemberRepositoryResult extends AddSpaceMemberResult {
  spaceName: string;
}

/** spaceName은 알림 전송용이며 API 응답에는 포함되지 않는다. */
interface UpdateSpaceMemberRoleRepositoryResult extends UpdateSpaceMemberRoleResult {
  spaceName: string;
}

/** recipientUserId, spaceName은 알림 전송용이며 API 응답에는 포함되지 않는다. */
interface RemoveSpaceMemberRepositoryResult extends RemoveSpaceMemberResult {
  recipientUserId: string;
  spaceName: string;
}
```

### 신규 메서드

```typescript
/** 전달된 필드만 업데이트한다 (PATCH 패턴). */
updateBandSpace(spaceId: string, input: UpdateBandSpaceInput, tx?: Prisma.TransactionClient): Promise<UpdateBandSpaceResult>;

/** deletedAt을 현재 시각으로 설정한다 (soft delete). */
deleteBandSpace(spaceId: string, tx?: Prisma.TransactionClient): Promise<DeleteBandSpaceResult>;

/** 역할을 업데이트하고 알림용 spaceName, userId를 반환한다. */
updateSpaceMemberRole(spaceId: string, memberId: string, input: UpdateSpaceMemberRoleInput, tx?: Prisma.TransactionClient): Promise<UpdateSpaceMemberRoleRepositoryResult>;

/** SpaceMember를 hard delete하고 알림용 recipientUserId, spaceName을 반환한다. */
removeSpaceMember(spaceId: string, memberId: string, tx?: Prisma.TransactionClient): Promise<RemoveSpaceMemberRepositoryResult>;

/** 밴드 멤버 전체의 userId 배열을 반환한다. 공간 생성 시 알림 수신자 조회에 사용한다. */
findBandMemberUserIds(bandId: string, tx?: Prisma.TransactionClient): Promise<string[]>;
```

---

## 3. Service 비즈니스 규칙

파일: `src/modules/spaces/spaces.service.ts`

### 기존 메서드 수정

```
addSpaceMember(spaceId, input):
1. repo.addSpaceMember → { spaceName, ...result } 구조분해
2. notificationsService.createNotification → 추가된 멤버에게 NOTICE
3. result 반환 (spaceName 제외)

createBandSpace(bandId, input):
1. repo.createBandSpace → result
2. repo.findBandMemberUserIds(bandId) → memberUserIds
3. memberUserIds.length > 0이면 notificationsService.createManyNotifications → 밴드 멤버 전원 NOTICE
4. result 반환
```

### 신규 메서드

```
updateBandSpace(spaceId, input):
1. repo.updateBandSpace(spaceId, input) → result 반환
   (존재 확인은 Repository가 Prisma update 실패로 자연스럽게 처리)

deleteBandSpace(spaceId):
1. repo.deleteBandSpace(spaceId) → result 반환

updateSpaceMemberRole(spaceId, memberId, input):
1. repo.updateSpaceMemberRole → { spaceName, ...result } 구조분해
2. notificationsService.createNotification → 역할 변경된 멤버에게 NOTICE
3. result 반환 (spaceName 제외)

removeSpaceMember(spaceId, memberId):
1. repo.removeSpaceMember → { recipientUserId, spaceName, ...result } 구조분해
2. notificationsService.createNotification → 제거된 멤버에게 NOTICE (targetPath: null)
3. result 반환 (recipientUserId, spaceName 제외)
```

---

## 4. DTO 정의

### UpdateBandSpaceBodyDto

파일: `src/modules/spaces/dto/update-band-space.dto.ts`

```typescript
// 모든 필드 @IsOptional — PATCH 패턴
class UpdateBandSpaceBodyDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() @IsNotEmpty() description?: string;
  @IsOptional() @IsEnum(BandSpaceType) spaceType?: SpaceType;
  @IsOptional() @IsEnum(BandSpaceStatus) status?: SpaceStatus;
  @IsOptional() @Matches(DATE_ONLY_PATTERN) @IsISO8601() startDate?: string;
  @IsOptional() @Matches(DATE_ONLY_PATTERN) @IsISO8601() @Validate(EndDateNotBeforeStartDateConstraint) endDate?: string;
}
```

### UpdateSpaceMemberRoleBodyDto

파일: `src/modules/spaces/dto/update-space-member-role.dto.ts`

```typescript
class UpdateSpaceMemberRoleBodyDto {
  @IsEnum(BandSpaceMemberRole) role!: BandSpaceMemberRole;
}
```

---

## 5. 알림 이벤트

| 이벤트         | 트리거 메서드        | 수신자                | 제목                                  | targetPath        |
| -------------- | -------------------- | --------------------- | ------------------------------------- | ----------------- |
| 합주 공간 생성 | createBandSpace      | 밴드 멤버 전원        | `새 합주 공간이 생성되었습니다`       | `/bandspaces/:id` |
| 멤버 추가      | addSpaceMember       | 추가된 멤버 본인      | `합주 공간에 추가되었습니다`          | `/bandspaces/:id` |
| 멤버 역할 변경 | updateSpaceMemberRole| 역할 변경된 멤버 본인 | `합주 공간에서 역할이 변경되었습니다` | `/bandspaces/:id` |
| 멤버 제거      | removeSpaceMember    | 제거된 멤버 본인      | `합주 공간에서 제거되었습니다`        | null              |

> 알림은 주요 DB 작업 완료 후 독립 전송. 알림 실패가 주요 작업에 영향 없음.

### 미적용 이벤트

| 상황 | 사유 |
|------|------|
| 합주 공간 수정 | 이미 멤버인 사람이 목록에서 확인 가능, 알림 가치 낮음 |
| 합주 공간 삭제 | 삭제된 공간은 targetPath 의미 없음, 삭제 전 별도 공지 흐름 권장 |

---

## 6. 트랜잭션 경계

| 메서드 | tx 필요 여부 | 이유 |
|--------|:-----------:|------|
| createBandSpace | 필요 (기존) | BandSpace + SpaceMember 원자 삽입 |
| addSpaceMember | 불필요 | SpaceMember 단일 삽입 |
| updateBandSpace | 불필요 | 단일 레코드 업데이트 |
| deleteBandSpace | 불필요 | 단일 레코드 soft delete |
| updateSpaceMemberRole | 불필요 | 단일 레코드 업데이트 |
| removeSpaceMember | 불필요 | 단일 레코드 hard delete |

---

## 7. 테스트 계획

파일: `src/modules/spaces/spaces.service.spec.ts`

| 메서드 | 케이스 |
|--------|--------|
| addSpaceMember | happy path + 알림 전송 검증 |
| createBandSpace | happy path + 알림 일괄 전송 검증 |
| getBandSpaces | happy path |
| getSpaceDetail | happy path / NotFoundException |
| updateBandSpace | happy path / NotFoundException |
| deleteBandSpace | happy path / NotFoundException |
| updateSpaceMemberRole | happy path + 알림 전송 검증 / NotFoundException |
| removeSpaceMember | happy path + 알림 전송 검증 / NotFoundException |
