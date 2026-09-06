# 설계 문서: bandspaces 모듈 B7 수정

`docs/backend/api-contract-audit.md` §6 B7 승인 수정안 기준. `DEMO_BAND_MEMBER_ID` 하드코딩 제거, 전 라우트 인증·인가 적용.

## API 명세 검증 결과

`docs/backend/api-docs/bandspaces.md` #28~#33, #57, #58 모두 엔드포인트·요청·응답·401/403/404가 명시되어 있고, 성공 응답은 `{ status:'success', error:null, message, data }` 형태로 컨벤션과 일치한다. `ApiSuccessResponse<T>`와도 호환된다(래핑은 `createSuccessResponse`가 담당).

검증 중 아래 1건의 불일치를 발견했다 — **자동 보완 대상**이 아니라 로직 결정이 필요해 미결 사항으로 기록한다:

- **#28 목록 조회**: api-docs는 403(멤버 아님)과 404(밴드 없음)를 모두 정의하지만, 현재 `findBandSpaces` 리포지토리 구현은 밴드 존재 여부를 전혀 확인하지 않는다(그냥 빈 목록 반환). 요청자 멤버십을 `bandId+userId`로 조회하는 이번 작업 특성상, 밴드가 없으면 멤버십 조회도 자연히 실패해 403이 먼저 뜨는 순서 역전이 발생한다. → **본 설계에서 `findBandById` 404 체크를 목록 조회·생성 두 곳에 동일하게 추가**하기로 결정했다(아래 미결 사항 1번 참고, 자동 보완으로 처리).

api-docs 파일 자체는 이미 401/403/404가 정확히 기술되어 있어 변환 노트에 추가할 보완 내역은 없다(문서 수정 불필요).

## 작업 범위

```
수정: src/modules/bandspaces/bandspaces.controller.ts        (전 라우트 AccessTokenGuard + Req 추가)
      src/modules/bandspaces/bandspaces.service.ts            (전 메서드 시그니처 변경: userId, tx? 추가)
      src/modules/bandspaces/repositories/bandspaces.repository.ts       (인터페이스 변경)
      src/modules/bandspaces/repositories/bandspaces.prisma-repository.ts (구현 변경, DEMO_BAND_MEMBER_ID 제거)
      src/modules/bandspaces/bandspaces.service.spec.ts        (Stub 갱신 + 신규 케이스 추가)
```

신규 파일 없음. DTO·타입 파일은 응답 구조 변경이 없으므로 수정하지 않는다.

## Repository 인터페이스 변경

`bandspaces.repository.ts`에 아래 3개 메서드를 추가한다.

```typescript
/** 밴드가 존재하고 삭제되지 않았는지 확인한다. */
findBandById(bandId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;

/** bandId + userId로 요청자의 밴드 멤버를 조회한다. 밴드가 삭제된 경우도 없는 것으로 취급한다. */
findBandMemberByBandIdAndUserId(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;

/** 합주 공간이 속한 밴드 ID를 조회한다. 공간이 없거나 삭제되었으면 null. */
findBandIdBySpaceId(spaceId: string, tx?: Prisma.TransactionClient): Promise<string | null>;
```

기존 메서드는 아래와 같이 시그니처가 바뀐다 (`DEMO_BAND_MEMBER_ID` 제거에 따른 필수 변경):

```typescript
/** requesterBandMemberId를 생성자·LEADER 멤버로 사용한다. */
createBandSpace(bandId: string, requesterBandMemberId: string, input: CreateBandSpaceInput, tx?: Prisma.TransactionClient): Promise<CreateBandSpaceResult>;

/** requesterBandMemberId를 isMine·onlyMine·myMembership 판별에 사용한다. */
findBandSpaces(bandId: string, requesterBandMemberId: string, query: GetBandSpacesQuery, tx?: Prisma.TransactionClient): Promise<GetBandSpacesResult>;
```

`findDetailByBandSpaceId`, `addBandSpaceMember`, `updateBandSpace`, `deleteBandSpace`, `updateBandSpaceMemberRole`, `removeBandSpaceMember`는 파라미터 목록은 그대로이나, 구현체(`bandspaces.prisma-repository.ts`)가 `tx` 파라미터를 실제로 사용하도록 고친다(아래 "발견한 기존 버그" 참고).

### 구현 참고 (schedules 패턴 재사용)

```typescript
async findBandById(bandId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null> {
  const client = tx ?? this.prisma;
  return client.band.findFirst({
    where: { id: bandId, deletedAt: null },
    select: { id: true },
  });
}

async findBandMemberByBandIdAndUserId(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null> {
  const client = tx ?? this.prisma;
  return client.bandMember.findFirst({
    where: { bandId, userId, band: { deletedAt: null } },
    select: { id: true },
  });
}

async findBandIdBySpaceId(spaceId: string, tx?: Prisma.TransactionClient): Promise<string | null> {
  const client = tx ?? this.prisma;
  const space = await client.bandSpace.findFirst({
    where: { id: spaceId, deletedAt: null },
    select: { bandId: true },
  });
  return space?.bandId ?? null;
}
```

`createBandSpace`는 `DEMO_BAND_MEMBER_ID` 두 곳(bandSpace.createdByBandMemberId, spaceMember.bandMemberId)을 `requesterBandMemberId` 파라미터로 교체하고, 기존에 무시되던 외부 `tx`를 받아들이도록 고친다:

```typescript
async createBandSpace(bandId: string, requesterBandMemberId: string, input: CreateBandSpaceInput, tx?: Prisma.TransactionClient): Promise<CreateBandSpaceResult> {
  const run = async (client: Prisma.TransactionClient) => {
    const bandSpace = await client.bandSpace.create({
      data: {
        bandId,
        name: input.name,
        description: input.description,
        spaceType: input.spaceType,
        status: input.status,
        startDate: new Date(`${input.startDate}T00:00:00.000Z`),
        endDate: new Date(`${input.endDate}T00:00:00.000Z`),
        createdByBandMemberId: requesterBandMemberId,
      },
    });

    await client.spaceMember.create({
      data: {
        bandSpaceId: bandSpace.id,
        bandMemberId: requesterBandMemberId,
        role: 'LEADER',
        status: 'ACTIVE',
      },
    });

    return bandSpace;
  };

  const createdSpace = tx ? await run(tx) : await this.prisma.$transaction(run);
  // ...기존 매핑 로직 그대로
}
```

`findBandSpaces`의 `where`/`select` 절 두 곳(`createBandSpaceWhereInput`의 `onlyMine`, `include.members.where.bandMemberId`)과 `mapBandSpaceListItem`의 `isMine` 비교를 `DEMO_BAND_MEMBER_ID` 대신 `requesterBandMemberId` 파라미터로 교체한다. `findBandSpaces`가 `tx`도 받아 `client = tx ?? this.prisma`로 count·findMany에 반영한다.

`findDetailByBandSpaceId`, `addBandSpaceMember`도 동일하게 `const client = tx ?? this.prisma;`를 추가해 내부 쿼리에 반영한다(현재는 tx가 인터페이스에만 선언되고 무시됨).

## Service 비즈니스 규칙

모든 메서드가 `userId: string`(요청자 ID)를 받고, 마지막에 `tx?: Prisma.TransactionClient`를 받는다. 쓰기 메서드는 `tx ? run(tx) : this.prisma.$transaction(run)` 패턴으로 사전 검증과 실행을 원자적으로 묶는다(스케줄 모듈의 `createSchedule` 패턴 재사용). 읽기 메서드는 스케줄 모듈의 `getSpaceSchedules`처럼 `$transaction`을 새로 열지 않고 `tx`를 그대로 전달만 한다.

```
getBandSpaces(bandId, userId, query, tx?):
1. findBandById(bandId, tx) → 없으면 NotFoundException('요청한 밴드를 찾을 수 없습니다.')
2. findBandMemberByBandIdAndUserId(bandId, userId, tx) → 없으면 ForbiddenException('해당 밴드의 멤버가 아닙니다.')
3. findBandSpaces(bandId, requesterBandMember.id, query, tx) 결과 반환

createBandSpace(bandId, userId, input, tx?):
[트랜잭션 시작]
1. findBandById(bandId, client) → 없으면 NotFoundException('요청한 밴드를 찾을 수 없습니다.')
2. findBandMemberByBandIdAndUserId(bandId, userId, client) → 없으면 ForbiddenException('해당 밴드의 멤버가 아닙니다.')
3. createBandSpace(bandId, requesterBandMember.id, input, client) 실행
[트랜잭션 종료]
4. (기존 로직 유지) findBandMemberUserIds로 알림 수신자 조회 후 전체에게 알림 전송

getBandSpaceDetail(spaceId, userId, tx?):
1. findBandIdBySpaceId(spaceId, tx) → 없으면 NotFoundException('요청한 합주 공간을 찾을 수 없습니다.')
2. findBandMemberByBandIdAndUserId(bandId, userId, tx) → 없으면 ForbiddenException('해당 밴드의 멤버가 아닙니다.')
3. findDetailByBandSpaceId(spaceId, tx) → undefined면 NotFoundException(동일 메시지, 방어적 유지)
4. 결과 반환

updateBandSpace(spaceId, userId, input, tx?):
[트랜잭션 시작]
1. findBandIdBySpaceId(spaceId, client) → 없으면 NotFoundException('요청한 합주 공간을 찾을 수 없습니다.')
2. findBandMemberByBandIdAndUserId(bandId, userId, client) → 없으면 ForbiddenException('해당 밴드의 멤버가 아닙니다.')
3. updateBandSpace(spaceId, input, client) 실행 및 반환
[트랜잭션 종료]

deleteBandSpace(spaceId, userId, tx?):
[트랜잭션 시작]
1. findBandIdBySpaceId → NotFoundException
2. findBandMemberByBandIdAndUserId → ForbiddenException
3. deleteBandSpace(spaceId, client) 실행 및 반환
[트랜잭션 종료]

addBandSpaceMember(spaceId, userId, input, tx?):
[트랜잭션 시작]
1. findBandIdBySpaceId → NotFoundException('요청한 합주 공간을 찾을 수 없습니다.')
2. findBandMemberByBandIdAndUserId → ForbiddenException('해당 밴드의 멤버가 아닙니다.')
3. addBandSpaceMember(spaceId, input, client) 실행 (기존 로직: 대상 bandMember 없음 404, 중복 409 그대로 유지)
[트랜잭션 종료]
4. (기존 로직 유지) 추가된 멤버에게 알림 전송

updateBandSpaceMemberRole(spaceId, userId, memberId, input, tx?):
[트랜잭션 시작]
1. findBandIdBySpaceId → NotFoundException
2. findBandMemberByBandIdAndUserId → ForbiddenException
3. updateBandSpaceMemberRole(spaceId, memberId, input, client) 실행 (기존 로직: 대상 멤버 없음 404 그대로 유지)
[트랜잭션 종료]
4. (기존 로직 유지) 알림 전송

removeBandSpaceMember(spaceId, userId, memberId, tx?):
[트랜잭션 시작]
1. findBandIdBySpaceId → NotFoundException
2. findBandMemberByBandIdAndUserId → ForbiddenException
3. removeBandSpaceMember(spaceId, memberId, client) 실행 (기존 로직: 대상 멤버 없음 404 그대로 유지)
[트랜잭션 종료]
4. (기존 로직 유지) 알림 전송
```

`BandSpacesService` 생성자에 `PrismaService`를 추가로 주입한다(schedules.service.ts 패턴).

```typescript
constructor(
  @Inject(BAND_SPACES_REPOSITORY) private readonly bandSpacesRepository: BandSpacesRepository,
  private readonly prisma: PrismaService,
  private readonly notificationsService: NotificationsService,
) {}
```

## Controller 변경

전 라우트에 `@UseGuards(AccessTokenGuard)`를 추가하고, `@Req() request: AuthenticatedRequest`로 `request.user.id`를 서비스에 전달한다. `schedules.controller.ts`와 동일한 로컬 인터페이스·임포트 경로를 재사용한다.

```typescript
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { AuthUser } from '../users/repositoreis/user.repository';

interface AuthenticatedRequest {
  user: AuthUser;
}

@ApiTags('합주 공간')
@Controller()
export class BandSpacesController {
  constructor(private readonly bandSpacesService: BandSpacesService) {}

  @UseGuards(AccessTokenGuard)
  @Post('bands/:bandId/bandspaces')
  @ApiOperation({ summary: '합주 공간 생성' })
  @ApiResponse({ status: 201, description: '합주 공간 생성 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '해당 밴드의 멤버가 아님' })
  @ApiResponse({ status: 404, description: '밴드를 찾을 수 없음' })
  async createBandSpace(
    @Req() request: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Body() input: CreateBandSpaceBodyDto,
  ): Promise<ApiSuccessResponse<CreateBandSpaceResult>> {
    const createdSpace = await this.bandSpacesService.createBandSpace(bandId, request.user.id, input);
    return createSuccessResponse('합주 공간 생성 성공', createdSpace);
  }

  // getBandSpaces, getBandSpaceDetail, updateBandSpace, deleteBandSpace,
  // addBandSpaceMember, updateBandSpaceMemberRole, removeBandSpaceMember도
  // 동일하게 @UseGuards(AccessTokenGuard) + @Req + request.user.id 전달 + api-docs 기준 @ApiResponse(401/403/404, 필요 시 400) 추가
}
```

기존 컨트롤러에는 `@ApiTags`/`@ApiOperation`/`@ApiResponse`가 전혀 없었다(컨벤션 10번 위반). 이번에 손대는 모든 핸들러이므로 함께 채운다 — 관련 없는 다른 컨트롤러까지 확장하지는 않는다.

## API 번호

기존 번호 그대로 사용, 신규 API 없음.

- `#28` GET `/bands/{bandId}/bandspaces` — 목록 조회
- `#29` GET `/bandspaces/{bandspaceId}` — 상세 조회
- `#30` POST `/bandspaces/{bandspaceId}/members` — 멤버 추가
- `#31` PATCH `/bandspaces/{bandspaceId}/members/{memberId}` — 멤버 역할 수정
- `#32` DELETE `/bandspaces/{bandspaceId}/members/{memberId}` — 멤버 제거
- `#33` POST `/bands/{bandId}/bandspaces` — 생성
- `#57` PATCH `/bandspaces/{bandspaceId}` — 수정
- `#58` DELETE `/bandspaces/{bandspaceId}` — 삭제

## DTO 정의

신규 DTO 없음. 기존 요청 DTO(`CreateBandSpaceBodyDto`, `AddBandSpaceMemberBodyDto`, `UpdateBandSpaceBodyDto`, `UpdateBandSpaceMemberRoleBodyDto`) 구조는 변경하지 않는다.

참고: `UpdateBandSpaceBodyDto`, `UpdateBandSpaceMemberRoleBodyDto`에는 현재 `@ApiProperty`가 없다(컨벤션 위반이나 이번 작업 대상 파일이 아니므로 수정하지 않는다). `docs/IMPROVEMENTS.md` 기록 대상으로 별도 언급한다.

## 트랜잭션 경계

| 메서드 | tx 필요 이유|
|---|---|
| `createBandSpace` | 밴드 존재 확인 + 멤버십 확인 + 공간 생성 + LEADER 멤버 생성을 원자적으로 묶어야 한다. 중간에 밴드 멤버가 탈퇴하는 경쟁 조건을 막는다. |
| `updateBandSpace` / `deleteBandSpace` | 공간 조회(bandId 획득) + 멤버십 확인 + 실행 사이의 경쟁 조건 방지. |
| `addBandSpaceMember` / `updateBandSpaceMemberRole` / `removeBandSpaceMember` | 동일 이유. 대상 멤버 조작이 검증과 분리되면 검증 통과 후 대상이 사라지는 경쟁 조건이 생긴다. |
| `getBandSpaces` / `getBandSpaceDetail` | 쓰기가 없으므로 `$transaction`을 새로 열지 않는다. `tx`가 주어지면 모든 repository 호출에 동일하게 전달만 한다(schedules `getSpaceSchedules` 패턴). |

## 테스트 계획

기존 `bandspaces.service.spec.ts`는 NestJS `TestingModule` + `jest.fn()` 패턴을 쓰고 있으나, `docs/backend/testing.md`는 Service 테스트에 손으로 만든 Stub(`new`로 직접 생성)을 요구하고 auth 모듈만 예외로 허용한다. bandspaces는 예외 대상이 아니므로 **이번 스펙 갱신 시 Stub 방식으로 전환**한다(같은 파일을 대량 수정하는 김에 하네스 규칙에 맞춘다 — 최소 범위 원칙과 충돌하지만, 모든 테스트 케이스가 이번 시그니처 변경으로 어차피 다시 작성돼야 하므로 리팩터링 비용이 이미 발생한다).

```
USER_ID           = '11111111-4111-4111-8111-111111111111'  // 요청자
OTHER_USER_ID     = '22222222-4222-4222-8222-222222222222'  // 비멤버
BAND_ID           = '33333333-4333-4333-8333-333333333333'
SPACE_ID          = '44444444-4444-4444-8444-444444444444'
REQUESTER_MEMBER_ID = '55555555-4555-4555-8555-555555555555'
```

| 메서드 | 케이스 | 패턴 |
|---|---|---|
| getBandSpaces | happy path | Stub 기본값, `findBandMemberByBandIdAndUserId`가 멤버 반환 |
| getBandSpaces | 밴드 없음 | `findBandById`가 null → NotFoundException |
| getBandSpaces | 멤버 아님 | `findBandMemberByBandIdAndUserId`가 null → ForbiddenException |
| getBandSpaces | 외부 tx 전달 | `createPrismaServiceFailingTransactionStub` — $transaction 미호출 확인, 모든 repository 호출에 동일 tx 전달 확인 |
| createBandSpace | happy path | `requesterBandMemberId`로 생성, 알림 전송 확인 |
| createBandSpace | 밴드 없음 | NotFoundException |
| createBandSpace | 멤버 아님 | ForbiddenException |
| createBandSpace | tx 일관성 | `findBandById`·`findBandMemberByBandIdAndUserId`·`createBandSpace`가 같은 client로 호출되는지 `capturedTransactions` 검증 |
| createBandSpace | 외부 tx 전달 | `createPrismaServiceFailingTransactionStub` |
| getBandSpaceDetail | happy path | 기존 케이스 유지 + 멤버십 확인 통과 |
| getBandSpaceDetail | 공간 없음 | `findBandIdBySpaceId`가 null → NotFoundException |
| getBandSpaceDetail | 멤버 아님 | ForbiddenException |
| getBandSpaceDetail | 외부 tx 전달 | 모든 repository 호출에 동일 tx 전달 확인 |
| updateBandSpace | happy path | 기존 케이스 유지 |
| updateBandSpace | 공간 없음 | NotFoundException (기존 유지, 이제 Service 레벨에서 먼저 발생) |
| updateBandSpace | 멤버 아님 | ForbiddenException (신규) |
| updateBandSpace | tx 일관성 | 3개 repository 호출 동일 client 검증 |
| updateBandSpace | 외부 tx 전달 | `createPrismaServiceFailingTransactionStub` |
| deleteBandSpace | happy path / 공간 없음 / 멤버 아님 / tx 일관성 / 외부 tx | updateBandSpace와 동일 패턴 |
| addBandSpaceMember | happy path | 기존 케이스 유지 |
| addBandSpaceMember | 공간 없음 | NotFoundException (신규 — 요청자 밴드 기준) |
| addBandSpaceMember | 요청자가 멤버 아님 | ForbiddenException (신규) |
| addBandSpaceMember | tx 일관성 / 외부 tx | 동일 패턴 |
| updateBandSpaceMemberRole | happy path / 공간 없음 / 멤버 아님 / tx 일관성 / 외부 tx | 동일 패턴 |
| removeBandSpaceMember | happy path / 공간 없음 / 멤버 아님 / tx 일관성 / 외부 tx | 동일 패턴 |

BadRequestException 케이스는 이번 변경으로 새로 발생하는 시나리오가 없어 생략한다(기존 `addBandSpaceMember`의 중복 참여는 `ConflictException`으로 별개 처리, 변경 없음).

## 미결 사항

1. **#28 목록 조회 404 순서**: 원래 `findBandSpaces`는 밴드 존재를 확인하지 않았다. 이번에 `findBandById` 404 체크를 추가하기로 결정했으나, 이는 승인된 수정안(§6 B7) 문구에 명시적으로 없던 범위 확장이다. api-docs의 401/403/404 순서를 지키기 위한 자연스러운 보완이라 판단해 진행하지만, 오케스트레이터/사용자 확인을 권장한다.
2. **역할 제약 없음**: 승인된 수정안은 "밴드 멤버인지 확인"만 요구하며, 합주 공간 수정·삭제·멤버 관리를 LEADER로 제한하는 규칙은 없다. 이번 설계는 밴드 멤버라면 누구나 가능하도록 그대로 둔다. 향후 LEADER 전용 정책이 필요하면 별도 요청으로 처리한다.
3. **기존 tx 배선 버그 동반 수정**: `findBandSpaces`, `findDetailByBandSpaceId`, `addBandSpaceMember`, `createBandSpace`는 인터페이스에 `tx?`가 선언되어 있었지만 구현체가 이를 받지 않거나 무시하고 있었다(자체 `$transaction`을 열거나 `this.prisma`를 직접 참조). 이번 시그니처 변경 대상 메서드이므로 함께 고친다. 범위 밖 다른 모듈에는 동일 패턴이 있어도 손대지 않는다.
4. **Service Stub 테스트 패턴 전환**: 기존 `bandspaces.service.spec.ts`는 `TestingModule`을 쓰고 있어 `testing.md` 기준과 다르다(auth 모듈만 예외). 이번에 전체 케이스를 다시 쓰는 김에 손으로 만든 Stub 패턴으로 전환하기로 했다 — 하네스 우선 원칙에 따른 결정이며, QA 단계에서 재확인 필요.
