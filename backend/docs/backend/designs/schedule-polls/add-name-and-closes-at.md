# 일정 조율 투표 — 이름·마감 기한 추가 설계

> 요청: Figma 시안(일정 투표 생성·목록·상세)에 있는 **일정 이름**과 **투표 마감 기한**을 백엔드가 저장·반환하도록 추가한다.
> 프론트는 이미 두 필드의 UI를 구현해 두었고 API 미지원으로 전송하지 않고 있다.

## 작업 범위

```
수정: prisma/schema.prisma                                        (SchedulePoll에 name·closesAt 추가)
신규: prisma/migrations/20260924120000_add_schedule_poll_name_and_closes_at/migration.sql
수정: src/modules/schedule-polls/dto/create-schedule-poll.dto.ts   (name·closesAt 필드)
수정: src/modules/schedule-polls/types/schedule-poll.type.ts       (name·closesAt 반환)
수정: src/modules/schedule-polls/repositories/schedule-polls.repository.ts (context 반환 타입 확장)
수정: src/modules/schedule-polls/repositories/schedule-polls.prisma-repository.ts (저장·매핑)
수정: src/modules/schedule-polls/schedule-polls.service.ts         (마감 검증 규칙)
수정: src/modules/schedule-polls/schedule-polls.service.spec.ts    (테스트 추가·기존 fixture 갱신)
수정: docs/backend/api-docs/schedule-polls.md                      (명세 반영)
```

## DB 스키마 변경

```prisma
model SchedulePoll {
  ...
  name     String   @db.VarChar(50)
  closesAt DateTime @map("closes_at") @db.Timestamptz(6)
}
```

마이그레이션 — 기존 행 백필 후 NOT NULL 확정:

```sql
ALTER TABLE "schedule_polls" ADD COLUMN "name" VARCHAR(50) NOT NULL DEFAULT '일정 투표';
ALTER TABLE "schedule_polls" ALTER COLUMN "name" DROP DEFAULT;
ALTER TABLE "schedule_polls" ADD COLUMN "closes_at" TIMESTAMPTZ(6);
UPDATE "schedule_polls" SET "closes_at" = "created_at" + interval '7 days';
ALTER TABLE "schedule_polls" ALTER COLUMN "closes_at" SET NOT NULL;
```

- nullable 대신 NOT NULL + 백필을 택했다. nullable로 두면 응답 타입이 영구히 `| null`이 되어
  프론트 폴백이 계약으로 굳는다. 아직 초기 단계라 백필 비용이 없다.

## DTO 정의

`CreateSchedulePollBodyDto`에 추가:

```typescript
@ApiProperty({ description: '일정 투표 이름', example: '좋은 날 오프닝 연습' })
@IsString({ message: stringValidationMessage })
@IsNotEmpty({ message: notemptyValidationMessage })
@MaxLength(SCHEDULE_POLL_NAME_MAX_LENGTH, { message: lengthValidationMessage })
name!: string;

@ApiProperty({ description: '투표 마감 일시', example: '2026-10-05T19:00:00+09:00' })
@IsString({ message: stringValidationMessage })
@IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
closesAt!: string;
```

`SCHEDULE_POLL_NAME_MAX_LENGTH = 50` (스키마 VarChar(50)과 일치. 프론트 입력은 40자 제한이라 여유).

## Repository 인터페이스 변경

시그니처 변화는 `findSchedulePollContextById` 반환 타입 확장뿐이다.

```typescript
/** 투표의 소속 공간·생성자·마감 일시를 조회한다(권한·마감 검증용). */
findSchedulePollContextById(
  schedulePollId: string,
  tx?: Prisma.TransactionClient,
): Promise<{ bandSpaceId: string; createdByBandMemberId: string | null; closesAt: Date } | null>;
```

`createSchedulePoll`은 시그니처 그대로(`input`에 name·closesAt 포함), 저장 필드만 추가.
`SchedulePollData`·`SchedulePollListItem`에 `name: string`, `closesAt: string(ISO)` 추가.

## Service 비즈니스 규칙

```
createSchedulePoll(userId, bandSpaceId, input, tx?):
  (기존 규칙 유지) + validateSchedulePollOptions에 마감 검증 추가
  - closesAt이 현재 시각 이후가 아니면 → BadRequestException('마감 기한은 현재 시각 이후여야 합니다.')

updateMySchedulePollVote(userId, schedulePollId, input, tx?):
  (기존 규칙 유지) + 멤버 확인 후:
  - context.closesAt <= 현재 시각이면 → BadRequestException('마감된 일정 투표에는 투표할 수 없습니다.')

getSchedulePoll / getSchedulePolls / deleteSchedulePoll: 변경 없음(응답에 name·closesAt 포함만).
  - 마감 후에도 조회·삭제는 허용한다(결과 확인·정리 용도).
```

## API 번호

`docs/backend/api-docs/schedule-polls.md`는 번호 체계 없는 코드 기반 신규 명세 — 기존 5개 엔드포인트의 요청/응답 예시에 name·closesAt을 반영하고 변환 노트를 남긴다.

## 트랜잭션 경계

기존과 동일 — create·vote·delete는 `tx ?? $transaction`, 조회는 선택 tx 전달. 새 tx 경계 없음.

## 테스트 계획

| 메서드 | 케이스 | 패턴 |
| --- | --- | --- |
| createSchedulePoll | happy path에 name·closesAt 반환 확인 | Stub 기본값(fixture에 필드 추가) |
| createSchedulePoll | closesAt이 과거면 BadRequestException | DEFAULT_INPUT 변형 |
| updateMySchedulePollVote | 마감 지난 투표에 투표 시 BadRequestException | context.closesAt 과거로 stub |
| updateMySchedulePollVote | 마감 전이면 기존 happy path 유지 | 기존 케이스가 커버(fixture closesAt 미래) |
| (기존 전 케이스) | fixture에 name·closesAt 추가 후 통과 유지 | — |

기존 spec의 NotFound/Forbidden/tx 일관성/외부 tx 케이스는 이번 변경으로 분기 추가가 없어 fixture 갱신만으로 유지한다.

## 미결 사항

- 마감 후 투표 차단을 넣었다(마감 기한이 표시 전용이면 규칙 제거만 하면 됨). 사용자 부재로 자율 결정 — 보고 예정.
- 마감 시 자동 일정 생성·알림은 이번 범위 밖(기존 MVP 노트 유지).
