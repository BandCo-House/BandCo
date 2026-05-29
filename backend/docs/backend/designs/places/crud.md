# Place 모듈 CRUD API 설계

> 작성일: 2026-05-29
> 보완일: 2026-05-29 (기존 모듈 탐색 기반 보완)
> API 명세 출처: `docs/backend/api-docs/place.md`

---

## 작업 범위

```
신규:
  src/modules/places/places.module.ts
  src/modules/places/places.controller.ts
  src/modules/places/places.service.ts
  src/modules/places/places.service.spec.ts
  src/modules/places/repositories/places.repository.ts
  src/modules/places/repositories/places.prisma-repository.ts
  src/modules/places/dto/create-place.dto.ts
  src/modules/places/dto/get-band-places-query.dto.ts
  src/modules/places/dto/update-place.dto.ts
  src/modules/places/types/create-place-result.type.ts
  src/modules/places/types/place-detail.type.ts
  src/modules/places/types/place-list.type.ts
  src/modules/places/types/update-place-result.type.ts
  src/modules/places/types/delete-place-result.type.ts

수정:
  src/app.module.ts (PlacesModule import 추가)

신규 (보완):
  src/modules/places/dto/get-place-detail-query.dto.ts
```

---

## DB 모델

`prisma/schema.prisma`의 `Place` 모델:

```
model Place {
  id            String     @id @default(uuid()) @db.Uuid
  bandId        String     @map("band_id") @db.Uuid
  name          String     @db.VarChar(120)
  address       String     @db.VarChar(255)
  detailAddress String?    @map("detail_address") @db.VarChar(255)
  isActive      Boolean    @default(true) @map("is_active")
  createdAt     DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)
  imageUrl      String?    @map("image_url") @db.VarChar(255)
  band          Band
  schedules     Schedule[]
}
```

비고:
- `deletedAt` 없음 → 소프트 삭제는 `isActive: false`로 처리 (API 명세 명시)
- `BandMember.role`: `BM` | `ADMIN` | `MEMBER` (스키마의 `BandMemberRole` enum)

---

## Repository 인터페이스 변경

`src/modules/places/repositories/places.repository.ts`

```typescript
import type { BandMemberRole, Prisma } from '../../../generated/prisma';
import type { CreatePlaceInput } from '../dto/create-place.dto';
import type { GetBandPlacesQuery } from '../dto/get-band-places-query.dto';
import type { UpdatePlaceInput } from '../dto/update-place.dto';
import type { CreatePlaceResult } from '../types/create-place-result.type';
import type { PlaceDetail } from '../types/place-detail.type';
import type { GetBandPlacesResult } from '../types/place-list.type';
import type { UpdatePlaceResult } from '../types/update-place-result.type';
import type { DeletePlaceResult } from '../types/delete-place-result.type';

export const PLACES_REPOSITORY = Symbol('PLACES_REPOSITORY');

export interface PlacesRepository {
  /**
   * 밴드 존재 여부를 확인하기 위해 삭제되지 않은 밴드를 조회한다.
   * Band 모델에는 deletedAt이 있으므로 반드시 deletedAt: null 조건을 포함한다.
   */
  findActiveBandById(
    bandId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string } | null>;

  /**
   * 요청자가 해당 밴드의 멤버인지 확인하기 위해 BandMember를 조회한다.
   */
  findBandMemberByBandIdAndUserId(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; role: BandMemberRole } | null>;

  /**
   * 새 장소를 생성하고 생성된 결과를 반환한다.
   */
  createPlace(
    bandId: string,
    input: CreatePlaceInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CreatePlaceResult>;

  /**
   * 밴드 내 장소 목록을 커서 기반 페이지네이션으로 조회한다.
   * where__is_active 필터가 전달되면 해당 활성 상태만 반환한다.
   */
  findBandPlaces(
    bandId: string,
    query: GetBandPlacesQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetBandPlacesResult>;

  /**
   * placeId로 단일 장소를 조회한다.
   * where__is_active 필터가 전달되면 해당 활성 상태만 반환한다.
   * 없거나 조건 불일치 시 null을 반환한다.
   */
  findPlaceById(
    placeId: string,
    isActive?: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<PlaceDetail | null>;

  /**
   * 권한 검증용으로 장소의 bandId를 포함해 조회한다.
   * isActive 상태와 무관하게 조회한다 (수정/삭제 시 이미 비활성인 장소도 조회 가능).
   */
  findPlaceForMutation(
    placeId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; bandId: string; isActive: boolean } | null>;

  /**
   * 장소 정보를 부분 수정(PATCH)하고 수정된 결과를 반환한다.
   */
  updatePlace(
    placeId: string,
    input: UpdatePlaceInput,
    tx?: Prisma.TransactionClient,
  ): Promise<UpdatePlaceResult>;

  /**
   * 장소를 소프트 삭제한다. isActive를 false로 변경한다.
   */
  deletePlace(
    placeId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DeletePlaceResult>;
}
```

---

## DTO 정의

### `get-place-detail-query.dto.ts` (보완 신규)

`GET /places/:placeId`에서 `where__is_active` boolean 쿼리 파라미터를 처리한다.
기존 spaces 모듈(`GetBandSpacesQueryDto`)에서 `parseOptionalBooleanValue` transform 패턴을 확인했으므로 동일하게 적용한다.

```typescript
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

import { parseOptionalBooleanValue } from '../../../common/validation/transform.util';
import { booleanValidationMessage } from '../../../common/validation-message/boolean-validation.message';

/**
 * 장소 상세 조회 쿼리를 검증한다.
 */
export class GetPlaceDetailQueryDto {
  @Transform(parseOptionalBooleanValue)
  @IsOptional()
  @IsBoolean({ message: booleanValidationMessage })
  where__is_active?: boolean;
}

export type GetPlaceDetailQuery = GetPlaceDetailQueryDto;
```

비고: 미결 사항 3번을 해소한다. `parseOptionalBooleanValue`는 `'true'` / `'false'` 문자열을 boolean으로 변환한다.

### `create-place.dto.ts`

```typescript
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { normalizeOptionalStringValue, trimStringValue } from '../../../common/validation/transform.util';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';

/**
 * 장소 생성 요청 본문을 검증한다.
 */
export class CreatePlaceBodyDto {
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  @MaxLength(120, { message: lengthValidationMessage })
  name!: string;

  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  address!: string;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  detailAddress?: string;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  imageUrl?: string;
}

export type CreatePlaceInput = CreatePlaceBodyDto;
```

### `get-band-places-query.dto.ts`

```typescript
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import { normalizeOptionalStringValue, parseOptionalBooleanValue, parseOptionalPositiveIntegerValue } from '../../../common/validation/transform.util';
import { booleanValidationMessage } from '../../../common/validation-message/boolean-validation.message';
import { enumValidationMessage } from '../../../common/validation-message/enum-validation.message';
import { intValidationMessage } from '../../../common/validation-message/int-validation.message';
import { minValidationMessage } from '../../../common/validation-message/min-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

const ORDER_DIRECTIONS = ['ASC', 'DESC'] as const;
export type PlaceListOrderDirection = (typeof ORDER_DIRECTIONS)[number];

/**
 * 장소 목록 조회 조건을 커서 기반 목록 API 규칙에 맞춰 검증한다.
 */
export class GetBandPlacesQueryDto {
  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__created_at: PlaceListOrderDirection = 'DESC';

  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__id: PlaceListOrderDirection = 'DESC';

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  take: number = 20;

  @Transform(parseOptionalBooleanValue)
  @IsOptional()
  @IsBoolean({ message: booleanValidationMessage })
  where__is_active?: boolean;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  cursor__created_at?: string;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  cursor__id?: string;
}

export type GetBandPlacesQuery = GetBandPlacesQueryDto;
```

비고: `where__is_active`는 QueryString으로 `'true'`/`'false'`가 들어오므로 `parseOptionalBooleanValue` transform이 필요하다. 초기 설계에서 누락되어 보완했다.

### `update-place.dto.ts`

```typescript
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { normalizeOptionalStringValue, trimStringValue } from '../../../common/validation/transform.util';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';

/**
 * 장소 수정 요청 본문은 PATCH 의미에 맞춰 전달된 필드만 검증한다.
 */
export class UpdatePlaceBodyDto {
  @Transform(trimStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  @MaxLength(120, { message: lengthValidationMessage })
  name?: string;

  @Transform(trimStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  address?: string;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  detailAddress?: string;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  imageUrl?: string;
}

export type UpdatePlaceInput = UpdatePlaceBodyDto;
```

---

## 타입 정의

### `create-place-result.type.ts`

```typescript
export interface CreatePlaceResult {
  placeId: string;
  bandId: string;
  name: string;
  address: string;
  detailAddress: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}
```

### `place-detail.type.ts`

```typescript
export interface PlaceDetail {
  placeId: string;
  bandId: string;
  name: string;
  address: string;
  detailAddress: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### `place-list.type.ts`

```typescript
export interface PlaceListItem {
  placeId: string;
  name: string;
  address: string;
  detailAddress: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceListCursor {
  createdAt: string;
  id: string;
}

export interface GetBandPlacesResult {
  bandId: string;
  items: PlaceListItem[];
  meta: {
    count: number;
    take: number;
    cursor: PlaceListCursor | null;
    next: string | null;
  };
}
```

### `update-place-result.type.ts`

```typescript
export interface UpdatePlaceResult {
  placeId: string;
  bandId: string;
  name: string;
  address: string;
  detailAddress: string | null;
  imageUrl: string | null;
  isActive: boolean;
  updatedAt: string;
}
```

### `delete-place-result.type.ts`

```typescript
export interface DeletePlaceResult {
  placeId: string;
  bandId: string;
  isActive: boolean;
}
```

---

## Service 비즈니스 규칙

### `createPlace(userId, bandId, input, tx?)`

```
1. 밴드 존재 확인: findActiveBandById(bandId)
   → null이면 NotFoundException('요청한 밴드를 찾을 수 없습니다.')
2. 멤버 확인: findBandMemberByBandIdAndUserId(bandId, userId)
   → null이면 ForbiddenException('밴드 멤버만 장소를 생성할 수 있습니다.')
3. 장소 생성: createPlace(bandId, input)
4. 결과 반환
```

비고: API 명세에서 멤버이면 역할 구분 없이 생성 가능. `BM` / `ADMIN` / `MEMBER` 모두 허용.

### `getBandPlaces(userId, bandId, query, tx?)`

```
1. 밴드 존재 확인: findActiveBandById(bandId)
   → null이면 NotFoundException('요청한 밴드를 찾을 수 없습니다.')
2. 멤버 확인: findBandMemberByBandIdAndUserId(bandId, userId)
   → null이면 ForbiddenException('밴드 멤버만 장소 목록을 조회할 수 있습니다.')
3. 커서 쌍 유효성 검사: cursor__created_at과 cursor__id 동시 존재 여부 확인
   → 한쪽만 있으면 BadRequestException('커서 조회에는 cursor__created_at과 cursor__id가 함께 필요합니다.')
4. order 방향 일치 검사: order__created_at과 order__id가 같아야 함
   → 다르면 BadRequestException('order__created_at과 order__id는 같은 방향이어야 합니다.')
5. 목록 조회: findBandPlaces(bandId, query)
6. 결과 반환
```

### `getPlace(userId, placeId, isActive?, tx?)`

```
1. 장소 조회: findPlaceById(placeId, isActive)
   → null이면 NotFoundException('요청한 장소를 찾을 수 없습니다.')
2. 멤버 확인: findBandMemberByBandIdAndUserId(place.bandId, userId)
   → null이면 ForbiddenException('밴드 멤버만 장소를 조회할 수 있습니다.')
3. 결과 반환
```

비고: place.bandId를 통해 밴드 멤버 확인. 별도 findActiveBandById 호출 불필요 (장소 조회 성공 시 밴드 존재 보장).

### `updatePlace(userId, placeId, input, tx?)`

```
1. 장소 조회: findPlaceForMutation(placeId)
   → null이면 NotFoundException('요청한 장소를 찾을 수 없습니다.')
2. 멤버 확인: findBandMemberByBandIdAndUserId(place.bandId, userId)
   → null이면 ForbiddenException('밴드 멤버만 장소를 수정할 수 있습니다.')
3. 수정 필드 존재 확인: name, address, detailAddress, imageUrl 중 하나 이상 존재
   → 없으면 BadRequestException('수정할 장소 정보가 필요합니다.')
4. 장소 수정: updatePlace(placeId, input)
5. 결과 반환
```

비고: PATCH이므로 멤버이면 역할 구분 없이 수정 가능. API 명세에 403 조건이 "수정 권한 없음"으로만 명시되어 있고, 확인된 비즈니스 규칙에서 수정 권한에 대한 별도 역할 제한이 없으므로 멤버 전체 허용으로 설계.

### `deletePlace(userId, placeId, tx?)`

```
1. 장소 조회: findPlaceForMutation(placeId)
   → null이면 NotFoundException('요청한 장소를 찾을 수 없습니다.')
2. 멤버 확인: findBandMemberByBandIdAndUserId(place.bandId, userId)
   → null이면 ForbiddenException('밴드 멤버가 아닙니다.')
3. 역할 확인: member.role === BM || member.role === ADMIN
   → 해당하지 않으면 ForbiddenException('밴드 리더 및 부리더만 장소를 삭제할 수 있습니다.')
4. 소프트 삭제: deletePlace(placeId)  ← isActive를 false로 변경
5. 결과 반환
```

비고: 확인된 비즈니스 규칙 3번 — 밴드 리더(`BM`) 및 부리더(`ADMIN`)만 삭제 가능.

---

## 트랜잭션 경계

| 메서드 | tx? 필요 | 이유 |
|--------|:--------:|------|
| createPlace | 필요 | 밴드·멤버 조회 → 생성이 같은 tx에서 원자적으로 실행되어야 함 |
| getBandPlaces | 불필요 | 읽기 전용. tx 파라미터는 인터페이스 일관성을 위해 선언하되 내부에서 새 $transaction을 열지 않음 |
| getPlace | 불필요 | 읽기 전용. 동일 |
| updatePlace | 필요 | 멤버 조회 → 수정이 같은 tx에서 원자적으로 실행되어야 함 |
| deletePlace | 필요 | 멤버 조회 → 소프트 삭제가 같은 tx에서 원자적으로 실행되어야 함 |

트랜잭션 패턴 (conventions.md 기준):

```typescript
async createPlace(userId: string, bandId: string, input: CreatePlaceInput, tx?: Prisma.TransactionClient): Promise<CreatePlaceResult> {
  const run = async (client: Prisma.TransactionClient): Promise<CreatePlaceResult> => {
    // ... 비즈니스 로직
  };
  return tx ? run(tx) : this.prisma.$transaction(run);
}
```

읽기 전용 메서드는 tx 파라미터를 받되 $transaction을 열지 않고 직접 repository에 전달한다:

```typescript
async getPlace(userId: string, placeId: string, isActive?: boolean, tx?: Prisma.TransactionClient): Promise<PlaceDetail> {
  const place = await this.placesRepository.findPlaceById(placeId, isActive, tx);
  if (place === null) throw new NotFoundException('...');
  const member = await this.placesRepository.findBandMemberByBandIdAndUserId(place.bandId, userId, tx);
  if (member === null) throw new ForbiddenException('...');
  return place;
}
```

---

## Controller 설계

### 패턴 기준

기존 `bands.controller.ts` 패턴을 따른다:
- `interface AuthenticatedRequest { user: User }` 를 Controller 파일 내에 선언한다.
- `@UseGuards(AccessTokenGuard)` 를 인증이 필요한 각 메서드에 데코레이터로 적용한다.
- `@Req() request: AuthenticatedRequest` 로 인증된 사용자 ID를 꺼낸다.
- `@Controller('places')` 와 `@Controller()` 를 어떻게 분리할지는 라우팅 규칙에 따른다 (아래 참조).

### 라우팅 분리

`POST /bands/:bandId/places`, `GET /bands/:bandId/places`는 경로 접두사가 `bands`이므로
`@Controller('bands')` 를 쓰거나, 기존 `SpacesController`처럼 `@Controller()` 에서 전체 경로를 쓴다.
기존 spaces 모듈이 `@Controller()` + 전체 경로 방식을 사용한다 → 동일하게 **`@Controller()` 방식**을 채택한다.

### 엔드포인트 정의

```
POST   /bands/:bandId/places     → placesService.createPlace(req.user.id, bandId, body)
GET    /bands/:bandId/places     → placesService.getBandPlaces(req.user.id, bandId, query)
GET    /places/:placeId          → placesService.getPlace(req.user.id, placeId, query.where__is_active)
PATCH  /places/:placeId          → placesService.updatePlace(req.user.id, placeId, body)
DELETE /places/:placeId          → placesService.deletePlace(req.user.id, placeId)
```

모든 엔드포인트: `@UseGuards(AccessTokenGuard)` 적용. 응답은 `ApiSuccessResponse<T>`로 감싼다.

### Controller 골격

```typescript
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { User } from '../../generated/prisma';

import { CreatePlaceBodyDto } from './dto/create-place.dto';
import { GetBandPlacesQueryDto } from './dto/get-band-places-query.dto';
import { GetPlaceDetailQueryDto } from './dto/get-place-detail-query.dto';
import { UpdatePlaceBodyDto } from './dto/update-place.dto';
import { PlacesService } from './places.service';

interface AuthenticatedRequest {
  user: User;
}

@Controller()
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Post('bands/:bandId/places')
  @UseGuards(AccessTokenGuard)
  async createPlace(
    @Req() request: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Body() input: CreatePlaceBodyDto,
  ): Promise<ApiSuccessResponse<CreatePlaceResult>> {
    const result = await this.placesService.createPlace(request.user.id, bandId, input);
    return createSuccessResponse('장소 생성 성공', result);
  }

  // ... 나머지 엔드포인트 동일 패턴
}
```

GET /places/:placeId의 `where__is_active`는 `GetPlaceDetailQueryDto`로 처리한다 (보완 신규 파일).

---

## Module 등록

`src/modules/places/places.module.ts` 구성:

```typescript
import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';

import { PlacesPrismaRepository } from './repositories/places.prisma-repository';
import { PLACES_REPOSITORY } from './repositories/places.repository';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';

@Module({
  imports: [AuthModule],
  controllers: [PlacesController],
  providers: [
    AccessTokenGuard,
    PlacesService,
    PlacesPrismaRepository,
    {
      provide: PLACES_REPOSITORY,
      useExisting: PlacesPrismaRepository,
    },
  ],
})
export class PlacesModule {}
```

비고:
- `AuthModule`을 import해야 `AccessTokenGuard`가 의존하는 `AuthService`, `UsersService`가 DI된다. (`bands.module.ts` 패턴 참조)
- `useExisting`은 이미 providers에 등록된 구현체를 재사용한다. (`spaces.module.ts` 패턴 참조)

`src/app.module.ts` 수정:

```typescript
import { PlacesModule } from './modules/places/places.module';

@Module({
  imports: [..., PlacesModule],
})
export class AppModule {}
```

---

## 테스트 계획

파일: `src/modules/places/places.service.spec.ts`

### 테스트 패턴 기준

`testing.md` 및 `bands.service.spec.ts`를 기준으로 한다:
- `TestingModule` 사용 금지. Service를 `new PlacesService(repository, prisma)`로 직접 생성한다.
- `PlacesService`는 생성자에서 `@Inject(PLACES_REPOSITORY)` 와 `PrismaService`를 받는다.
- `createPrismaServiceStub()` 과 `createPrismaServiceFailingTransactionStub()`을 파일 내에 정의한다.

```typescript
function createPrismaServiceStub(): PrismaService {
  const tx = { transactionClient: true };
  return {
    async $transaction(callback: (tx: unknown) => Promise<unknown>) {
      return callback(tx);
    },
  } as PrismaService;
}

function createPrismaServiceFailingTransactionStub(): PrismaService {
  return {
    async $transaction() {
      throw new Error('외부 tx가 있으면 새 transaction을 열지 않아야 합니다.');
    },
  } as unknown as PrismaService;
}
```

### UUID 상수

```typescript
const USER_ID  = '11111111-1111-4111-8111-111111111111';
const BAND_ID  = '22222222-2222-4222-8222-222222222222';
const PLACE_ID = '33333333-3333-4333-8333-333333333333';
const MEMBER_ID = '44444444-4444-4444-8444-444444444444';
```

### Stub 기본값

```typescript
const DEFAULT_BAND = { id: BAND_ID };
const DEFAULT_MEMBER = { id: MEMBER_ID, role: BandMemberRole.MEMBER };
const DEFAULT_PLACE_FOR_MUTATION = { id: PLACE_ID, bandId: BAND_ID, isActive: true };
const DEFAULT_PLACE_DETAIL = { placeId: PLACE_ID, bandId: BAND_ID, name: '연습실', address: '서울', detailAddress: null, imageUrl: null, isActive: true, createdAt: '...', updatedAt: '...' };
const DEFAULT_CREATE_RESULT = { placeId: PLACE_ID, bandId: BAND_ID, name: '연습실', address: '서울', detailAddress: null, imageUrl: null, isActive: true, createdAt: '...' };
```

### 테스트 케이스 목록

| 메서드 | 케이스 | 기댓값 |
|--------|--------|--------|
| createPlace | happy path | 장소 생성 결과 반환 |
| createPlace | 밴드 없음 | NotFoundException |
| createPlace | 밴드 멤버 아님 | ForbiddenException |
| createPlace | tx 일관성 | capturedTransactions 동일 참조 확인 |
| createPlace | 외부 tx 전달 | $transaction 미호출 확인 |
| getBandPlaces | happy path | 목록 결과 반환 |
| getBandPlaces | 밴드 없음 | NotFoundException |
| getBandPlaces | 밴드 멤버 아님 | ForbiddenException |
| getBandPlaces | cursor 쌍 불일치 | BadRequestException |
| getBandPlaces | order 방향 불일치 | BadRequestException |
| getPlace | happy path | 장소 상세 반환 |
| getPlace | 장소 없음 | NotFoundException |
| getPlace | 밴드 멤버 아님 | ForbiddenException |
| updatePlace | happy path | 수정된 장소 반환 |
| updatePlace | 장소 없음 | NotFoundException |
| updatePlace | 밴드 멤버 아님 | ForbiddenException |
| updatePlace | 수정 필드 없음 | BadRequestException |
| updatePlace | tx 일관성 | capturedTransactions 동일 참조 확인 |
| updatePlace | 외부 tx 전달 | $transaction 미호출 확인 |
| deletePlace | happy path (BM) | 소프트 삭제 결과 반환 |
| deletePlace | happy path (ADMIN) | 소프트 삭제 결과 반환 |
| deletePlace | 장소 없음 | NotFoundException |
| deletePlace | 밴드 멤버 아님 | ForbiddenException |
| deletePlace | MEMBER 역할 | ForbiddenException |
| deletePlace | tx 일관성 | capturedTransactions 동일 참조 확인 |
| deletePlace | 외부 tx 전달 | $transaction 미호출 확인 |

### Service 생성 예시

```typescript
it('장소 생성 성공', async () => {
  const repository = createPlacesRepositoryStub();
  const service = new PlacesService(repository, createPrismaServiceStub());
  const result = await service.createPlace(USER_ID, BAND_ID, { name: '연습실', address: '서울' });
  expect(result.placeId).toBe(PLACE_ID);
});

it('외부 tx가 있으면 새 $transaction을 열지 않는다', async () => {
  const externalTx = { transactionClient: true };
  const repository = createPlacesRepositoryStub();
  const service = new PlacesService(repository, createPrismaServiceFailingTransactionStub());
  await service.createPlace(USER_ID, BAND_ID, { name: '연습실', address: '서울' }, externalTx as never);
  // $transaction이 호출되었다면 위 stub이 throw했을 것
});
```

### Stub 구조 예시

```typescript
function createPlacesRepositoryStub(options?: {
  band?: { id: string } | null;
  member?: { id: string; role: BandMemberRole } | null;
  placeDetail?: PlaceDetail | null;
  placeForMutation?: { id: string; bandId: string; isActive: boolean } | null;
  onCreatePlace?: (bandId: string, input: CreatePlaceInput, tx: unknown) => void;
  onUpdatePlace?: (placeId: string, input: UpdatePlaceInput, tx: unknown) => void;
  onDeletePlace?: (placeId: string, tx: unknown) => void;
}): PlacesRepository {
  return {
    async findActiveBandById(_bandId, _tx) {
      return options?.band !== undefined ? options.band : DEFAULT_BAND;
    },
    async findBandMemberByBandIdAndUserId(_bandId, _userId, _tx) {
      return options?.member !== undefined ? options.member : DEFAULT_MEMBER;
    },
    async createPlace(bandId, input, tx) {
      options?.onCreatePlace?.(bandId, input, tx);
      return DEFAULT_CREATE_RESULT;
    },
    async findBandPlaces(_bandId, _query, _tx) {
      return { bandId: BAND_ID, items: [], meta: { count: 0, take: 20, cursor: null, next: null } };
    },
    async findPlaceById(_placeId, _isActive, _tx) {
      return options?.placeDetail !== undefined ? options.placeDetail : DEFAULT_PLACE_DETAIL;
    },
    async findPlaceForMutation(_placeId, _tx) {
      return options?.placeForMutation !== undefined ? options.placeForMutation : DEFAULT_PLACE_FOR_MUTATION;
    },
    async updatePlace(placeId, input, tx) {
      options?.onUpdatePlace?.(placeId, input, tx);
      return { placeId, bandId: BAND_ID, name: input.name ?? '연습실', address: input.address ?? '서울', detailAddress: null, imageUrl: null, isActive: true, updatedAt: '...' };
    },
    async deletePlace(placeId, tx) {
      options?.onDeletePlace?.(placeId, tx);
      return { placeId, bandId: BAND_ID, isActive: false };
    },
  };
}
```

---

## Service 생성자 구조

`PlacesService`는 `PrismaService`를 tx 진입점으로 직접 주입받는다. Repository 인터페이스와 `PrismaService` 두 개를 생성자에서 받는다.

```typescript
@Injectable()
export class PlacesService {
  constructor(
    @Inject(PLACES_REPOSITORY)
    private readonly placesRepository: PlacesRepository,
    private readonly prisma: PrismaService,
  ) {}
}
```

비고: `Service → Repository 인터페이스에만 의존`이 원칙이지만, 트랜잭션 진입점으로만 PrismaService를 주입받는 것은 컨벤션에서 허용하는 패턴이다(`conventions.md` 3.2절 참조).

---

## Repository 구현 주의사항 (Prisma)

- `findActiveBandById`: `where: { id: bandId, deletedAt: null }` — Band 모델에 deletedAt이 있으므로 필수
- `findBandMemberByBandIdAndUserId`: `where: { bandId, userId }` — BandMember에는 deletedAt 없음
- `findPlaceById`: `where: { id: placeId, ...(isActive !== undefined ? { isActive } : {}) }` — 조건부 필터
- `findPlaceForMutation`: `where: { id: placeId }` — isActive 무관 조회
- `deletePlace`: `update({ where: { id: placeId }, data: { isActive: false } })` — 소프트 삭제

커서 기반 페이지네이션(`findBandPlaces`): 복잡한 커서 조건(createdAt + id 복합 커서)을 포함하므로 Repository 구현체 단위 테스트가 필요하다. 해당 테스트는 별도 `places.prisma-repository.spec.ts`로 작성한다.

`meta.next` URL 생성 방식:
- `bands.service.spec.ts` 및 기존 모듈에서 next URL은 Repository 구현체에서 직접 문자열로 생성한다.
- API 명세의 next 예시: `/bands/{bandId}/places?cursor=...&take=20&order__created_at=DESC`
- 구현 시 `cursor__created_at={encodeURIComponent(item.createdAt)}&cursor__id={item.id}` 형태로 query string을 직접 조합한다.
- `bandId`를 Repository의 `findBandPlaces` 메서드에 전달해야 next URL에 포함할 수 있으므로, 현재 설계(`findBandPlaces(bandId, query)`)에서 bandId를 받는 것은 올바르다.

Prisma Record 타입 패턴 (`spaces.prisma-repository.ts` 참조):
```typescript
type PlaceRecord = Prisma.PlaceGetPayload<{
  select: {
    id: true;
    bandId: true;
    name: true;
    address: true;
    detailAddress: true;
    imageUrl: true;
    isActive: true;
    createdAt: true;
    updatedAt: true;
  };
}>;
```
Prisma Repository에서 반환 타입을 명시할 때 `Prisma.XxxGetPayload<{ select/include: ... }>` 패턴을 사용한다.

---

## 미결 사항

1. **PATCH /places/:placeId 수정 권한 범위**: 사용자 확인 완료 기준에서 수정 권한은 명시되지 않아 "밴드 멤버 전체"로 설계했다. 추후 리더/부리더 전용으로 제한이 필요하면 Service의 역할 체크 조건 추가로 처리 가능.

2. **GET /bands/:bandId/places cursor 구조**: API 명세의 meta.cursor와 meta.next 형태가 다소 비일관적이다 (`cursor`는 객체, `next`는 URL 문자열). 기존 밴드 목록 타입(`MyBandListCursor`)과 맞춰 cursor를 객체로 유지하고 next는 URL 문자열로 생성하는 방향으로 설계했다. Repository 구현 주의사항에 next URL 생성 방식을 추가했다.

3. **GET /places/:placeId where__is_active 쿼리 파라미터**: `parseOptionalBooleanValue` transform 패턴 확인 완료. `get-place-detail-query.dto.ts` 신규 추가로 해소. (보완 완료)

4. **Repository 단위 테스트 대상**: `findBandPlaces`는 커서 기반 페이지네이션 로직이 복잡하므로 `places.prisma-repository.spec.ts` 작성이 권장된다. testing.md 기준 "복잡한 Prisma 쿼리" 조건에 해당.

5. **`where__is_active` boolean transform in GetBandPlacesQueryDto**: `parseOptionalBooleanValue` 및 `booleanValidationMessage` 누락이 확인되어 보완했다. (보완 완료)
