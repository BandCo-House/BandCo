# Schedules 모듈 설계

> 작성일: 2026-05-29
> API 명세: `docs/backend/api-docs/schedules.md`
> 스키마 기준: `prisma/schema.prisma`

---

## 핵심 결정 사항 요약

- `Schedule` 모델에 `deletedAt` 필드 없음 → **hard delete** 사용
- cursor pagination: `(startAt ASC, id ASC)` 복합 커서 — 기존 `createPagination`은 offset 방식이므로 스케줄 전용 cursor 유틸 신규 작성
- 응답 형식: `ApiSuccessResponse<T>` 래핑 (`createSuccessResponse` 사용)
- 테스트 패턴: Repository Stub + `new SchedulesService(...)` 직접 생성 (TestingModule 금지)

---

## 1. 작업 범위

### 신규

```
src/modules/schedules/
├── dto/
│   ├── create-schedule.dto.ts
│   ├── update-schedule.dto.ts
│   └── get-schedules-query.dto.ts
├── repositories/
│   ├── schedules.repository.ts
│   └── schedules.prisma-repository.ts
├── types/
│   ├── create-schedule-result.type.ts
│   ├── update-schedule-result.type.ts
│   ├── delete-schedule-result.type.ts
│   ├── schedule-list-item.type.ts
│   ├── band-schedule-list-item.type.ts
│   └── schedule-detail.type.ts
├── schedules.controller.ts
├── schedules.service.ts
├── schedules.service.spec.ts
└── schedules.module.ts
```

### 수정 없음

- `src/common/pagination/` — offset 방식 그대로 유지. cursor 로직은 Repository 내부에서 직접 처리
- `prisma/schema.prisma` — 스키마 변경 없음

---

## 2. Repository 인터페이스

파일: `src/modules/schedules/repositories/schedules.repository.ts`

```typescript
import type { Prisma } from '../../../generated/prisma';
import type { CreateScheduleInput } from '../dto/create-schedule.dto';
import type { UpdateScheduleInput } from '../dto/update-schedule.dto';
import type { GetSchedulesQuery } from '../dto/get-schedules-query.dto';
import type { CreateScheduleResult } from '../types/create-schedule-result.type';
import type { UpdateScheduleResult } from '../types/update-schedule-result.type';
import type { DeleteScheduleResult } from '../types/delete-schedule-result.type';
import type { GetSpaceSchedulesResult } from '../types/schedule-list-item.type';
import type { GetBandSchedulesResult } from '../types/band-schedule-list-item.type';
import type { GetScheduleDetailResult } from '../types/schedule-detail.type';

export const SCHEDULES_REPOSITORY = Symbol('SCHEDULES_REPOSITORY');

export interface SchedulesRepository {
  /**
   * 밴드 공간에 일정을 생성한다.
   * songIds, participantBandMemberIds가 있으면 각 중간 테이블에도 레코드를 삽입한다.
   */
  createSchedule(
    bandSpaceId: string,
    createdByBandMemberId: string,
    input: CreateScheduleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CreateScheduleResult>;

  /**
   * 일정을 수정한다.
   * songIds가 있으면 ScheduleSong을 전량 교체(deleteMany → createMany)한다.
   * participantBandMemberIds가 있으면 ScheduleParticipant를 전량 교체한다.
   */
  updateSchedule(
    scheduleId: string,
    input: UpdateScheduleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<UpdateScheduleResult>;

  /**
   * 일정을 hard delete한다.
   * Schedule에 deletedAt이 없으므로 prisma.schedule.delete()를 사용한다.
   */
  deleteSchedule(
    scheduleId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DeleteScheduleResult>;

  /**
   * 밴드 공간 기준 일정 목록을 cursor pagination으로 조회한다.
   */
  findSchedulesBySpaceId(
    bandSpaceId: string,
    query: GetSchedulesQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetSpaceSchedulesResult>;

  /**
   * 밴드 기준 전체 일정 목록을 cursor pagination으로 조회한다.
   * 밴드에 속한 모든 BandSpace의 Schedule을 조회한다.
   */
  findSchedulesByBandId(
    bandId: string,
    query: GetSchedulesQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetBandSchedulesResult>;

  /**
   * 일정 상세 정보를 조회한다.
   * participants, songs, place를 함께 로드한다.
   */
  findScheduleById(
    scheduleId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<GetScheduleDetailResult | undefined>;

  /**
   * 밴드 공간 존재 여부를 확인한다 (deletedAt: null 조건 포함).
   */
  findBandSpaceById(
    bandSpaceId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string } | null>;

  /**
   * 밴드 존재 여부를 확인한다 (deletedAt: null 조건 포함).
   */
  findBandById(
    bandId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string } | null>;
}
```

---

## 3. Service 비즈니스 규칙

파일: `src/modules/schedules/schedules.service.ts`

### 3.1 createSchedule

```
createSchedule(bandSpaceId, createdByBandMemberId, input, tx?):
1. findBandSpaceById(bandSpaceId) → null이면 NotFoundException('요청한 밴드 공간을 찾을 수 없습니다.')
2. startAt < endAt 검증 → 위반 시 BadRequestException('종료 시간은 시작 시간보다 이후여야 합니다.')
   (DTO에서 처리하기 과한 논리 검증이므로 Service에서 처리)
3. repo.createSchedule(bandSpaceId, createdByBandMemberId, input, tx) 호출
4. CreateScheduleResult 반환
```

> 트랜잭션: createSchedule은 Schedule 생성 + ScheduleSong 삽입 + ScheduleParticipant 삽입을 원자적으로 처리해야 하므로 내부적으로 tx를 열거나 외부 tx를 전달받는다.

### 3.2 updateSchedule

```
updateSchedule(scheduleId, input, tx?):
1. findScheduleById(scheduleId) → undefined이면 NotFoundException('요청한 일정을 찾을 수 없습니다.')
2. input에 startAt과 endAt이 모두 있으면 startAt < endAt 검증
   → 위반 시 BadRequestException('종료 시간은 시작 시간보다 이후여야 합니다.')
3. input에 하나만 있으면 기존 DB 값과 비교 검증
   (예: endAt만 변경 시 기존 startAt보다 이후인지 확인)
4. repo.updateSchedule(scheduleId, input, tx) 호출
5. UpdateScheduleResult 반환
```

> 트랜잭션: songIds 또는 participantBandMemberIds 변경 시 deleteMany + createMany를 원자적으로 처리해야 하므로 tx 필요.

### 3.3 deleteSchedule

```
deleteSchedule(scheduleId, tx?):
1. findScheduleById(scheduleId) → undefined이면 NotFoundException('요청한 일정을 찾을 수 없습니다.')
2. repo.deleteSchedule(scheduleId, tx) 호출
3. DeleteScheduleResult { scheduleId, deletedAt } 반환
   (Schedule에 deletedAt 컬럼이 없으므로 deletedAt은 서비스 레이어에서 new Date()로 생성)
```

> 참고: API 응답에 deletedAt이 있지만 schema에 deletedAt 컬럼이 없다. deletedAt 값은 hard delete 시점의 타임스탬프를 Service에서 직접 생성하여 응답 전용으로 사용한다.

### 3.4 getSpaceSchedules

```
getSpaceSchedules(bandSpaceId, query, tx?):
1. findBandSpaceById(bandSpaceId) → null이면 NotFoundException('요청한 밴드 공간을 찾을 수 없습니다.')
2. repo.findSchedulesBySpaceId(bandSpaceId, query, tx) 호출
3. GetSpaceSchedulesResult 반환
```

### 3.5 getBandSchedules

```
getBandSchedules(bandId, query, tx?):
1. findBandById(bandId) → null이면 NotFoundException('요청한 밴드를 찾을 수 없습니다.')
2. repo.findSchedulesByBandId(bandId, query, tx) 호출
3. GetBandSchedulesResult 반환
```

### 3.6 getScheduleDetail

```
getScheduleDetail(scheduleId, tx?):
1. findScheduleById(scheduleId) → undefined이면 NotFoundException('요청한 일정을 찾을 수 없습니다.')
2. GetScheduleDetailResult 반환
```

---

## 4. DTO 및 타입 정의

### 4.1 CreateScheduleBodyDto

파일: `src/modules/schedules/dto/create-schedule.dto.ts`

```typescript
export class CreateScheduleBodyDto {
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  title!: string;

  @IsString({ message: stringValidationMessage })
  @IsEnum(ScheduleType, { message: enumValidationMessage })
  scheduleType!: ScheduleType;

  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  startAt!: string;

  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  endAt!: string;

  @IsString({ message: stringValidationMessage })
  @IsEnum(ScheduleStatus, { message: enumValidationMessage })
  status!: ScheduleStatus;

  // 선택 필드
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsUUID('4', { message: uuidValidationMessage })
  placeId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: uuidValidationMessage })
  songIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: uuidValidationMessage })
  participantBandMemberIds?: string[];

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  memo?: string;
}

export type CreateScheduleInput = CreateScheduleBodyDto;
```

### 4.2 UpdateScheduleBodyDto

파일: `src/modules/schedules/dto/update-schedule.dto.ts`

```typescript
// 모든 필드 선택 (partial update)
export class UpdateScheduleBodyDto {
  @IsOptional()
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  title?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsEnum(ScheduleType, { message: enumValidationMessage })
  scheduleType?: ScheduleType;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  startAt?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  endAt?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsUUID('4', { message: uuidValidationMessage })
  placeId?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsEnum(ScheduleStatus, { message: enumValidationMessage })
  status?: ScheduleStatus;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: uuidValidationMessage })
  songIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: uuidValidationMessage })
  participantBandMemberIds?: string[];

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  memo?: string;
}

export type UpdateScheduleInput = UpdateScheduleBodyDto;
```

### 4.3 GetSchedulesQueryDto

파일: `src/modules/schedules/dto/get-schedules-query.dto.ts`

```typescript
export class GetSchedulesQueryDto {
  // cursor: 이전 페이지 마지막 아이템의 startAt (ISO8601)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  cursor__start_at?: string;

  // cursor: 이전 페이지 마지막 아이템의 id (동일 startAt 내 순서 보장)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsUUID('4', { message: uuidValidationMessage })
  cursor__id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  take?: number = 50;

  // 필터
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  where__start_at__greater__than_equal?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  where__start_at__less_than_equal?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsUUID('4', { message: uuidValidationMessage })
  where__place_id?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsEnum(ScheduleType, { message: enumValidationMessage })
  where__schedule_type?: ScheduleType;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsEnum(ScheduleStatus, { message: enumValidationMessage })
  where__status?: ScheduleStatus;
}

export type GetSchedulesQuery = GetSchedulesQueryDto;
```

### 4.4 Service 내부 반환 타입

```typescript
// types/create-schedule-result.type.ts
export interface ScheduleSongItem {
  songId: string;
  title: string;
  artistName: string;
}

export interface CreateScheduleResult {
  scheduleId: string;
  spaceId: string;
  placeId: string | null;
  createdByBandMemberId: string;
  scheduleType: string;
  title: string;
  startAt: string;
  endAt: string;
  status: string;
  songs: ScheduleSongItem[];
  participantCount: number;
  memo: string | null;
  createdAt: string;
}

// types/update-schedule-result.type.ts
export interface UpdateScheduleResult {
  scheduleId: string;
  spaceId: string;
  scheduleType: string;
  title: string;
  startAt: string;
  endAt: string;
  placeId: string | null;
  status: string;
  songIds: string[];
  participantCount: number;
  memo: string | null;
  updatedAt: string;
}

// types/delete-schedule-result.type.ts
export interface DeleteScheduleResult {
  scheduleId: string;
  deletedAt: string;
}

// types/schedule-list-item.type.ts — 공간 기준 목록
export interface SpaceScheduleListItem {
  scheduleId: string;
  spaceId: string;
  scheduleType: string;
  title: string;
  startAt: string;
  endAt: string;
  place: { placeId: string; name: string } | null;
  songs: ScheduleSongItem[];
  participantCount: number;
  memo: string | null;
  status: string;
}

export interface ScheduleListCursor {
  startAt: string;
  id: string;
}

export interface ScheduleListMeta {
  count: number;
  take: number;
  cursor: ScheduleListCursor | null;
  next: string | null;
}

export interface GetSpaceSchedulesResult {
  items: SpaceScheduleListItem[];
  meta: ScheduleListMeta;
}

// types/band-schedule-list-item.type.ts — 밴드 기준 목록
export interface BandScheduleListItem {
  scheduleId: string;
  spaceId: string;
  space: { spaceId: string; name: string };
  scheduleType: string;
  title: string;
  startAt: string;
  endAt: string;
  status: string;
}

export interface GetBandSchedulesResult {
  items: BandScheduleListItem[];
  meta: ScheduleListMeta;
}

// types/schedule-detail.type.ts
export interface ScheduleParticipantDetail {
  participantId: string;
  bandMemberId: string;
  attendanceStatus: string | null;
  note: string | null;
}

export interface SchedulePlaceDetail {
  placeId: string;
  name: string;
  address: string;
}

export interface GetScheduleDetailResult {
  schedule: {
    scheduleId: string;
    spaceId: string;
    scheduleType: string;
    title: string;
    startAt: string;
    endAt: string;
    status: string;
    place: SchedulePlaceDetail | null;
    songs: ScheduleSongItem[];
    participants: ScheduleParticipantDetail[];
    memo: string | null;
    createdByBandMemberId: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

---

## 5. Soft Delete 여부

`prisma/schema.prisma`의 `Schedule` 모델에 `deletedAt` 필드가 없다. → **hard delete** 적용.

- `deleteSchedule`: `prisma.schedule.delete({ where: { id: scheduleId } })`
- 조회 메서드: `deletedAt: null` 조건 불필요
- 단, 연관 엔티티인 `BandSpace`와 `Band`에는 `deletedAt`이 있으므로, 존재 확인 시 반드시 `deletedAt: null` 조건 포함

---

## 6. Cursor Pagination 구현 가이드

기존 `createPagination`은 offset 방식이므로 schedules에 사용하지 않는다.
Repository 내부에서 `(startAt ASC, id ASC)` 복합 커서 방식으로 직접 구현한다.

### Prisma cursor 쿼리 패턴

```typescript
// cursor가 있을 때
const where: Prisma.ScheduleWhereInput = {
  bandSpaceId,
  // 필터 조건 ...
  OR: cursor
    ? [
        { startAt: { gt: new Date(cursor.startAt) } },
        { startAt: new Date(cursor.startAt), id: { gt: cursor.id } },
      ]
    : undefined,
};

const items = await client.schedule.findMany({
  where,
  orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
  take: query.take + 1, // 다음 페이지 존재 여부 확인용으로 1개 더 조회
  include: { /* ... */ },
});

const hasNext = items.length > query.take;
const pageItems = hasNext ? items.slice(0, query.take) : items;
const lastItem = pageItems[pageItems.length - 1];

const meta: ScheduleListMeta = {
  count: pageItems.length,
  take: query.take,
  cursor: lastItem
    ? { startAt: lastItem.startAt.toISOString(), id: lastItem.id }
    : null,
  next: hasNext && lastItem
    ? `?cursor__start_at=${encodeURIComponent(lastItem.startAt.toISOString())}&cursor__id=${lastItem.id}`
    : null,
};
```

> `next` 필드는 다음 페이지 커서 파라미터를 포함한 쿼리스트링이다. 클라이언트가 cursor__start_at과 cursor__id를 쿼리에 담아 재요청하면 다음 페이지를 조회할 수 있다.

---

## 7. 트랜잭션 경계

| 메서드 | tx 필요 여부 | 이유 |
|--------|:----------:|------|
| createSchedule | 필요 | Schedule 생성 + ScheduleSong 삽입(여러 행) + ScheduleParticipant 삽입(여러 행)을 원자적으로 처리 |
| updateSchedule | 필요 | ScheduleSong/ScheduleParticipant deleteMany + createMany를 원자적으로 처리 |
| deleteSchedule | 불필요 | Schedule.delete 단일 쿼리 (cascade로 관련 레코드 자동 삭제됨) |
| getSpaceSchedules | 불필요 | 읽기 전용 |
| getBandSchedules | 불필요 | 읽기 전용 |
| getScheduleDetail | 불필요 | 읽기 전용 |

### 트랜잭션 패턴 (conventions.md 기준)

```typescript
async createSchedule(
  bandSpaceId: string,
  createdByBandMemberId: string,
  input: CreateScheduleInput,
  tx?: Prisma.TransactionClient,
): Promise<CreateScheduleResult> {
  const run = async (client: Prisma.TransactionClient): Promise<CreateScheduleResult> => {
    const space = await this.repo.findBandSpaceById(bandSpaceId, client);
    if (space === null) throw new NotFoundException('...');
    return this.repo.createSchedule(bandSpaceId, createdByBandMemberId, input, client);
  };
  return tx ? run(tx) : this.prisma.$transaction(run);
}
```

---

## 8. Controller 구조

파일: `src/modules/schedules/schedules.controller.ts`

```typescript
@Controller()
export class SchedulesController {
  @Post('bandspaces/:bandspaceId/schedules')
  async createSchedule(...): Promise<ApiSuccessResponse<CreateScheduleResult>>

  @Patch('schedules/:scheduleId')
  async updateSchedule(...): Promise<ApiSuccessResponse<UpdateScheduleResult>>

  @Delete('schedules/:scheduleId')
  async deleteSchedule(...): Promise<ApiSuccessResponse<DeleteScheduleResult>>

  @Get('bandspaces/:bandspaceId/schedules')
  async getSpaceSchedules(...): Promise<ApiSuccessResponse<GetSpaceSchedulesResult>>

  @Get('bands/:bandId/schedules')
  async getBandSchedules(...): Promise<ApiSuccessResponse<GetBandSchedulesResult>>

  @Get('schedules/:scheduleId')
  async getScheduleDetail(...): Promise<ApiSuccessResponse<GetScheduleDetailResult>>
}
```

> 인증된 사용자의 bandMemberId를 createdByBandMemberId로 사용하는 부분은 현재 DEMO_BAND_MEMBER_ID 패턴을 따른다 (인증 모듈 연동 전).

---

## 9. 테스트 계획

파일: `src/modules/schedules/schedules.service.spec.ts`

테스트 패턴: Repository Stub + `new SchedulesService(stub, prismaStub)` 직접 생성 (TestingModule 금지)

### 9.1 UUID 상수 (파일 상단)

```typescript
const BAND_SPACE_ID = '11111111-1111-4111-8111-111111111111';
const SCHEDULE_ID   = '22222222-2222-4222-8222-222222222222';
const BAND_ID       = '33333333-3333-4333-8333-333333333333';
const BAND_MEMBER_ID = '44444444-4444-4444-8444-444444444444';
```

### 9.2 테스트 케이스 표

| 메서드 | 케이스 | 검증 방법 |
|--------|--------|-----------|
| createSchedule | happy path — 일정 생성 결과를 반환한다 | result.scheduleId, result.spaceId 검증 |
| createSchedule | 밴드 공간이 없으면 NotFoundException을 던진다 | rejects.toThrow(NotFoundException) |
| createSchedule | endAt이 startAt보다 이전이면 BadRequestException을 던진다 | rejects.toThrow(BadRequestException) |
| createSchedule | Schedule 생성과 Song/Participant 삽입을 같은 tx로 처리한다 | capturedTransactions 모두 동일 참조 확인 |
| createSchedule | 외부 tx가 있으면 새 $transaction을 열지 않는다 | createPrismaServiceFailingTransactionStub 사용 |
| updateSchedule | happy path — 수정 결과를 반환한다 | result.scheduleId, result.updatedAt 검증 |
| updateSchedule | 일정이 없으면 NotFoundException을 전파한다 | rejects.toThrow(NotFoundException) |
| updateSchedule | endAt만 변경 시 기존 startAt보다 이전이면 BadRequestException을 던진다 | rejects.toThrow(BadRequestException) |
| updateSchedule | Song/Participant 교체를 같은 tx로 처리한다 | capturedTransactions 모두 동일 참조 확인 |
| updateSchedule | 외부 tx가 있으면 새 $transaction을 열지 않는다 | createPrismaServiceFailingTransactionStub 사용 |
| deleteSchedule | happy path — scheduleId와 deletedAt을 반환한다 | result.scheduleId, result.deletedAt 검증 |
| deleteSchedule | 일정이 없으면 NotFoundException을 전파한다 | rejects.toThrow(NotFoundException) |
| getSpaceSchedules | happy path — items와 meta를 반환한다 | result.items.length, result.meta.cursor 검증 |
| getSpaceSchedules | 밴드 공간이 없으면 NotFoundException을 던진다 | rejects.toThrow(NotFoundException) |
| getBandSchedules | happy path — items와 meta를 반환한다 | result.items[0].space 검증 |
| getBandSchedules | 밴드가 없으면 NotFoundException을 던진다 | rejects.toThrow(NotFoundException) |
| getScheduleDetail | happy path — schedule 상세를 반환한다 | result.schedule.participants, result.schedule.songs 검증 |
| getScheduleDetail | 일정이 없으면 NotFoundException을 던진다 | rejects.toThrow(NotFoundException) |

---

## 10. 미결 사항

1. **인증 연동**: 현재 `createdByBandMemberId`는 `DEMO_BAND_MEMBER_ID` 상수 사용. 인증 모듈 연동 후 JWT에서 bandMemberId를 추출하는 방식으로 교체 필요. 구현 시 spaces 모듈의 기존 패턴 그대로 따름.

2. **권한 검증 (ForbiddenException)**: API 명세에 403 응답이 있으나 "권한 없음" 조건이 구체적으로 정의되지 않음. 예를 들어 "일정 수정/삭제는 생성자만 가능한지, 공간 멤버라면 누구나 가능한지"가 불명확. MVP에서는 인증 미연동이므로 ForbiddenException 구현 보류.

3. **next URL 형식**: 설계에서 cursor 쿼리스트링 형태로 설계했으나, 절대 URL로 반환할지 쿼리스트링만 반환할지 확정 필요. API 명세 응답 예시에서 `"next": null`로만 표시되어 있어 비 null 값의 형식이 불명확.

4. **startAt/endAt nullable**: 스키마에서 `startAt`, `endAt`이 `DateTime?`으로 optional이지만 API 명세 Request Body에는 필수로 정의되어 있음. DTO에서는 필수로 처리하되 DB 레이어에서 null 허용 구조 유지.

5. **updateSchedule의 시간 검증 복잡도**: `startAt`만 변경하거나 `endAt`만 변경할 때 기존 DB 값을 조회해 비교해야 하는데, 이 비교를 Service에서 할지 Repository가 조회 결과를 반환 후 Service에서 할지 결정 필요. 현재 설계는 `findScheduleById` 결과를 Service에서 재사용하는 방향.
