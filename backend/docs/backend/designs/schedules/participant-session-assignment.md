# 일정 참여자 세션 배정 (schedules)

## 배경

합주 상세·추가 화면에 "세션 편성"이 들어간다. 세션(보컬·기타·베이스·드럼)마다 멤버를 배정하고, **한 사람이 여러 세션을 겸할 수 있다**(김민수 = 보컬 + 기타). 회의(MEETING)는 지금처럼 세션 없이 참여자만 고른다.

현재 `ScheduleParticipant`에는 세션 컬럼이 없고 `@@unique([scheduleId, bandMemberId])`가 같은 멤버의 중복 행을 막고 있어, 이 화면을 저장할 수 없다.

## 작업 범위

```
수정: prisma/schema.prisma                                      (ScheduleParticipant.skillTypeId, SkillType 역관계, unique 변경)
신규: prisma/migrations/20260906120000_add_schedule_participant_skill_type/migration.sql
수정: src/modules/schedules/dto/create-schedule.dto.ts          (participants 추가)
수정: src/modules/schedules/dto/update-schedule.dto.ts          (participants 추가)
신규: src/modules/schedules/dto/schedule-participant.dto.ts     (ScheduleParticipantInputDto)
수정: src/modules/schedules/types/schedule-detail.type.ts       (participants[].skillType)
수정: src/modules/schedules/types/create-schedule-result.type.ts(ScheduleSongItem.key)
수정: src/modules/schedules/repositories/schedules.repository.ts(findSkillTypeIdsByIds 선언)
수정: src/modules/schedules/repositories/schedules.prisma-repository.ts
수정: src/modules/schedules/schedules.service.ts                (세션 검증)
수정: src/modules/schedules/schedules.service.spec.ts
수정: src/modules/schedules/repositories/schedules.prisma-repository.spec.ts
수정: docs/backend/api-docs/schedules.md

teams 모듈 (팀 세션 편성):
수정: prisma/schema.prisma                                      (TeamMember.skillTypeId, unique 변경)
수정: src/modules/teams/dto/add-team-member.dto.ts              (skillTypeId 추가)
수정: src/modules/teams/types/get-team-members-result.type.ts   (TeamMemberListItem.skillType)
수정: src/modules/teams/types/add-team-member-result.type.ts    (skillType)
수정: src/modules/teams/repositories/teams.repository.ts
수정: src/modules/teams/repositories/teams.prisma-repository.ts
수정: src/modules/teams/teams.service.ts                        (skillType 검증)
수정: src/modules/teams/teams.service.spec.ts
수정: docs/backend/api-docs/teams.md
```

## API 번호

기존 명세의 아래 API를 수정한다. 새 엔드포인트는 없다.

- `POST /bandspaces/{bandspaceId}/schedules` — 요청에 `participants` 추가
- `PATCH /schedules/{scheduleId}` — 요청에 `participants` 추가
- `GET /schedules/{scheduleId}` — 응답 `participants[].skillType`, `songs[].key` 추가
- `GET /bandspaces/{bandspaceId}/schedules`, `GET /bands/{bandId}/schedules` — 응답 `songs[].key` 추가

## 스키마 변경

```prisma
model ScheduleParticipant {
  ...
  /// 이 일정에서 맡은 세션. 합주 전용이라 회의 참여자는 null이다.
  /// 한 사람이 보컬·기타를 겸할 수 있어 (일정, 멤버) 조합이 여러 행으로 나뉜다.
  skillTypeId String?    @map("skill_type_id") @db.Uuid
  skillType   SkillType? @relation(fields: [skillTypeId], references: [id], onDelete: SetNull)

  @@unique([scheduleId, bandMemberId, skillTypeId])
}
```

`onDelete: SetNull` — 스킬 종류가 지워져도 참여자 자체는 남아야 한다(일정에서 사람이 사라지면 안 된다).

### NULL과 unique 인덱스 (중요)

Postgres는 unique 인덱스에서 **NULL을 서로 다른 값으로 취급**한다. 즉 `@@unique([scheduleId, bandMemberId, skillTypeId])`는 `skillTypeId = NULL`인 회의 참여자의 중복을 **막지 못한다**.

> 기존 `@@unique([scheduleId, bandMemberId])`가 하던 회의 참여자 중복 방지가 이 변경으로 조용히 사라진다. 마이그레이션에서 partial unique index로 복구한다.

```sql
CREATE UNIQUE INDEX "schedule_participants_schedule_member_no_skill_key"
  ON "schedule_participants" ("schedule_id", "band_member_id")
  WHERE "skill_type_id" IS NULL;
```

Prisma 스키마 문법으로는 partial index를 표현할 수 없어 마이그레이션 SQL에만 존재한다. `prisma migrate dev`가 drift로 감지하지 않도록 마이그레이션 파일에 주석으로 이유를 남긴다.

리포지토리에서도 `bandMemberId|skillTypeId` 키로 중복을 제거해 DB에 닿기 전에 거른다(에러 대신 무시 — 같은 사람을 같은 세션에 두 번 넣는 건 사용자 실수지 실패가 아니다).

## DTO 정의

```typescript
// dto/schedule-participant.dto.ts (신규)
export class ScheduleParticipantInputDto {
  @ApiProperty({ description: '참여자 밴드 멤버 ID (UUID)' })
  @IsUUID('4', { message: uuidValidationMessage })
  bandMemberId!: string;

  @ApiPropertyOptional({ description: '이 일정에서 맡은 세션 ID (UUID). 합주 전용, 회의는 생략' })
  @IsOptional()
  @IsUUID('4', { message: uuidValidationMessage })
  skillTypeId?: string;
}
```

`CreateScheduleBodyDto` / `UpdateScheduleBodyDto`에 동일하게 추가:

```typescript
@ApiPropertyOptional({ description: '참여자 목록 (세션 포함). 전달 시 전체 교체', type: [ScheduleParticipantInputDto] })
@IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => ScheduleParticipantInputDto)
participants?: ScheduleParticipantInputDto[];
```

### 하위호환

기존 `participantBandMemberIds: string[]`는 **그대로 남긴다.** 백엔드가 프론트보다 먼저 배포되므로 운영 중인 프론트가 계속 동작해야 한다.

| 요청 | 처리 |
| --- | --- |
| `participants`만 | 그대로 사용 |
| `participantBandMemberIds`만 | `{ bandMemberId, skillTypeId: undefined }[]`로 변환 |
| 둘 다 | **`participants` 우선**, `participantBandMemberIds` 무시 |
| 둘 다 없음 (POST) | 참여자 없음 |
| 둘 다 없음 (PATCH) | 참여자 건드리지 않음 (기존 partial update 규칙 유지) |

`participants`를 우선하는 이유: 신규 필드가 세션 정보까지 담아 표현력이 더 크다. 둘 다 보내는 클라이언트는 없어야 정상이므로 에러 대신 조용히 신규 필드를 택한다.

정규화는 **Service**에서 한다(Repository는 이미 정규화된 목록만 받는다).

## Repository 인터페이스 변경

```typescript
/** 존재하는 skillType ID만 추려 돌려준다. 세션 배정 검증용. */
findExistingSkillTypeIds(skillTypeIds: string[], tx?: Prisma.TransactionClient): Promise<string[]>;
```

`createSchedule` / `updateSchedule`의 input 타입은 그대로 두고, 내부에서 `input.participants`를 읽는다(Service가 정규화해 넣어준다).

## Service 비즈니스 규칙

```
normalizeParticipants(input):
1. input.participants가 있으면 그대로, 없고 participantBandMemberIds가 있으면 skillTypeId 없이 변환
2. 둘 다 없으면 undefined 반환 (PATCH에서 "건드리지 않음"과 구분하기 위해 빈 배열이 아니라 undefined)

validateParticipantSkillTypes(participants, client):
1. skillTypeId가 있는 항목의 ID를 모은다 → 없으면 통과
2. findExistingSkillTypeIds로 조회
3. 하나라도 없으면 BadRequestException('존재하지 않는 세션이 포함되어 있습니다.')

createSchedule(bandSpaceId, userId, input, tx?):
1. (기존) 공간 존재 확인 → NotFoundException
2. (기존) 밴드 멤버 확인 → ForbiddenException
3. (기존) 시간 범위 검증 → BadRequestException
4. (기존) teamId 검증 → BadRequestException
5. [신규] participants 정규화
6. [신규] scheduleType이 MEETING인데 skillTypeId가 있으면 BadRequestException('회의 일정에는 세션을 배정할 수 없습니다.')
7. [신규] skillType 존재 검증
8. Repository 위임

updateSchedule(scheduleId, input, tx?):
1. (기존) 일정 존재 확인 → NotFoundException
2. (기존) 시간 범위 검증 → BadRequestException
3. [신규] participants 정규화
4. [신규] 세션 배정 가능 여부는 **최종 scheduleType** 기준으로 본다
   (input.scheduleType ?? existing.schedule.scheduleType) — 합주를 회의로 바꾸면서
   세션을 남겨두면 조용히 무효한 데이터가 남는다
5. [신규] skillType 존재 검증
6. Repository 위임
```

> 합주 → 회의로 바꿀 때 기존 세션 배정은 어떻게 되나? `participants`를 안 보내면 이전 세션이 그대로 남는다. **Repository에서 scheduleType이 MEETING으로 바뀌면 남아 있는 participant의 skillTypeId를 NULL로 정리한다.** 안 그러면 회의인데 세션이 붙은 행이 남는다.

## 응답 변경

```typescript
// types/schedule-detail.type.ts
export interface ScheduleParticipantSkillType {
  skillTypeId: string;
  name: string;
}

export interface ScheduleParticipantDetail {
  ...
  skillType: ScheduleParticipantSkillType | null;   // 추가
}

// types/create-schedule-result.type.ts
export interface ScheduleSongItem {
  songId: string;
  title: string;
  artistName: string;
  key: string | null;    // 추가 (Song.key는 SongKey? enum)
}
```

`key`는 enum 값을 문자열로 그대로 내보낸다(프론트가 `F# Minor` 같은 표기로 매핑). 목록 조회(`GET /bandspaces/.../schedules`, `GET /bands/.../schedules`)의 songs select에도 `key`를 추가한다 — 같은 타입을 쓰므로 빠뜨리면 타입 에러가 난다.

## 트랜잭션 경계

새 메서드 `findExistingSkillTypeIds`는 읽기 전용이지만 `tx?`를 받는다 — 생성·수정 트랜잭션 안에서 호출되므로 같은 client를 써야 커밋 전 상태를 본다(하네스 규칙: 모든 Service/Repository 메서드는 `tx?`를 마지막 선택 인자로 받는다).

## 테스트 계획

| 메서드 | 케이스 | 패턴 |
| --- | --- | --- |
| createSchedule | participants로 세션 배정 저장 | Stub 기본값 |
| createSchedule | 한 멤버가 두 세션에 배정 | Stub, 2행 생성 확인 |
| createSchedule | participantBandMemberIds만 → skillTypeId 없이 변환 | Stub |
| createSchedule | 둘 다 오면 participants 우선 | Stub |
| createSchedule | 존재하지 않는 skillTypeId | BadRequestException |
| createSchedule | MEETING인데 세션 배정 | BadRequestException |
| createSchedule | tx 일관성 | capturedTransactions 검증 |
| createSchedule | 외부 tx 전달 | createPrismaServiceFailingTransactionStub |
| updateSchedule | participants 전체 교체 | Stub |
| updateSchedule | 합주→회의 전환 시 세션 정리 | Stub |
| updateSchedule | 최종 scheduleType 기준 검증 | BadRequestException |
| repository | 중복 (member, skillType) 제거 | createMany 인자 검증 |
| repository | 상세 응답에 skillType·key 포함 | 매핑 검증 |

## 팀 세션 편성 (teams)

프론트의 "팀 선택 → 그 팀 세션 조합대로 배정"이 성립하려면 팀에도 멤버별 세션 배정이 있어야 한다. 지금은 개인 `UserSkill`(그 사람이 가진 스킬 전체)뿐이라 "팀 편성"을 표현하지 못한다.

일정과 **같은 모양**으로 맞춘다 — 한 사람이 팀 안에서 보컬·기타를 겸할 수 있다.

```prisma
model TeamMember {
  ...
  /// 이 팀에서 맡은 세션. 미배정이면 null.
  skillTypeId String?    @map("skill_type_id") @db.Uuid
  skillType   SkillType? @relation(fields: [skillTypeId], references: [id], onDelete: SetNull)

  @@unique([teamId, bandMemberId, skillTypeId])
}
```

`ScheduleParticipant`와 같은 NULL 문제가 있으므로 partial unique index도 같이 만든다:

```sql
CREATE UNIQUE INDEX "team_members_team_member_no_skill_key"
  ON "team_members" ("team_id", "band_member_id")
  WHERE "skill_type_id" IS NULL;
```

### API 변경

- `POST /teams/{teamId}/members` — 요청에 `skillTypeId?` 추가, 응답에 `skillType` 추가
- `GET /teams/{teamId}/members` — 응답 각 항목에 `skillType: { skillTypeId, name } | null` 추가

`skills`(개인 `UserSkill` 목록)는 그대로 둔다. **`skillType`(팀 배정)과 `skills`(개인 보유)는 다른 값이다** — 카드 위 라벨이 전자, 이름 아래 줄이 후자다.

```
addTeamMember(teamId, bandMemberId, skillTypeId?, tx?):
1. (기존) 팀 존재·권한 확인
2. [신규] skillTypeId가 있으면 존재 검증 → 없으면 BadRequestException
3. Repository 위임
```

| 메서드 | 케이스 | 패턴 |
| --- | --- | --- |
| addTeamMember | skillTypeId 없이 추가 | Stub 기본값 |
| addTeamMember | skillTypeId와 함께 추가 | Stub |
| addTeamMember | 존재하지 않는 skillTypeId | BadRequestException |
| addTeamMember | 같은 멤버를 다른 세션으로 추가 | Stub, 2행 |

## 미결 사항

1. **세션당 인원 제한 없음.** 같은 세션(보컬)에 두 명을 배정하는 걸 막지 않는다. 디자인상 세션 1칸 = 1명이지만, 서버가 강제하면 나중에 "기타 2명" 같은 편성을 못 하게 된다. 프론트에서만 1칸 1명으로 제한한다.
2. **`GET /schedules/:id` 응답의 participants 정렬 순서 미정.** 현재도 정렬이 없다(Prisma 기본). 세션 편성은 순서가 눈에 보이므로 나중에 정렬 기준이 필요할 수 있다.
