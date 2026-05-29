# Common 모듈 설계 문서

> 작성일: 2026-05-29
> 목적: GET /common/genres, GET /common/skills 구현
> 검토: 초안 보완 — DB 모델 확인, 테스트 패턴 정렬, app.module.ts 범위 추가

---

## 작업 범위

### 신규 파일

```
신규: src/modules/common/common.controller.ts
신규: src/modules/common/common.service.ts
신규: src/modules/common/common.service.spec.ts
신규: src/modules/common/common.module.ts
신규: src/modules/common/repositories/common.repository.ts
신규: src/modules/common/repositories/common.prisma-repository.ts
신규: src/modules/common/repositories/common.prisma-repository.spec.ts
신규: src/modules/common/types/genre-list.type.ts
신규: src/modules/common/types/skill-type-list.type.ts
```

### 기존 파일 수정

```
수정: src/app.module.ts — CommonModule import 추가 (imports 배열에 CommonModule 삽입)
```

---

## API 명세

출처: `docs/backend/api-docs/common.md`

| Method | Path            | 인증 | 설명               |
|--------|-----------------|:----:|--------------------|
| GET    | /common/genres  | 없음 | 장르 전체 목록 조회 |
| GET    | /common/skills  | 없음 | 스킬 타입 전체 목록 조회 |

두 API 모두 Guard 없음. `@Public()` 또는 Guard 미적용 방식으로 처리한다.

---

## 관련 DB 모델

`prisma/schema.prisma` 기준:

```prisma
model Genre {
  id             String          @id @default(uuid()) @db.Uuid
  name           String          @db.VarChar(20)
  bandGenres     BandGenre[]
  favoriteGenres FavoriteGenre[]

  @@map("genres")
}

model SkillType {
  id         String      @id @default(uuid()) @db.Uuid
  name       String      @db.VarChar(40)
  songSkills SongSkill[]
  userSkills UserSkill[]

  @@map("skill_types")
}
```

`deletedAt` 필드 없음 — soft delete 조건 불필요.

---

## 타입 정의

### src/modules/common/types/genre-list.type.ts

```typescript
export interface GenreItem {
  genreId: string;
  name: string;
}

export interface GenreListResult {
  genres: GenreItem[];
}
```

### src/modules/common/types/skill-type-list.type.ts

```typescript
export interface SkillTypeItem {
  skillTypeId: string;
  name: string;
}

export interface SkillTypeListResult {
  skills: SkillTypeItem[];
}
```

---

## Repository 인터페이스 변경

### src/modules/common/repositories/common.repository.ts

```typescript
import type { Prisma } from '../../../generated/prisma';
import type { GenreListResult } from '../types/genre-list.type';
import type { SkillTypeListResult } from '../types/skill-type-list.type';

export const COMMON_REPOSITORY = Symbol('COMMON_REPOSITORY');

export interface CommonRepository {
  /**
   * 장르 전체 목록을 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GenreListResult>} 장르 목록
   */
  findAllGenres(tx?: Prisma.TransactionClient): Promise<GenreListResult>;

  /**
   * 스킬 타입 전체 목록을 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<SkillTypeListResult>} 스킬 타입 목록
   */
  findAllSkillTypes(tx?: Prisma.TransactionClient): Promise<SkillTypeListResult>;
}
```

---

## Service 비즈니스 규칙

### src/modules/common/common.service.ts

CommonService는 PrismaService를 주입받지 않는다. 두 메서드 모두 단일 쿼리이며 `$transaction` 진입점이 필요하지 않다. 외부 tx가 전달되면 Repository에 그대로 넘긴다.

#### getGenres(tx?: Prisma.TransactionClient): Promise<GenreListResult>

```
1. commonRepository.findAllGenres(tx) 호출
2. 결과 그대로 반환
예외: 없음 (빈 배열 반환 정상)
```

#### getSkillTypes(tx?: Prisma.TransactionClient): Promise<SkillTypeListResult>

```
1. commonRepository.findAllSkillTypes(tx) 호출
2. 결과 그대로 반환
예외: 없음 (빈 배열 반환 정상)
```

---

## PrismaRepository 구현 방향

### src/modules/common/repositories/common.prisma-repository.ts

```typescript
@Injectable()
export class CommonPrismaRepository implements CommonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllGenres(tx?: Prisma.TransactionClient): Promise<GenreListResult> {
    const client = tx ?? this.prisma;
    const genres = await client.genre.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return { genres: genres.map(g => ({ genreId: g.id, name: g.name })) };
  }

  async findAllSkillTypes(tx?: Prisma.TransactionClient): Promise<SkillTypeListResult> {
    const client = tx ?? this.prisma;
    const skillTypes = await client.skillType.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return { skills: skillTypes.map(s => ({ skillTypeId: s.id, name: s.name })) };
  }
}
```

---

## Controller

### src/modules/common/common.controller.ts

```typescript
@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Get('genres')
  async getGenres(): Promise<ApiSuccessResponse<GenreListResult>> {
    const result = await this.commonService.getGenres();
    return createSuccessResponse('장르 목록 조회 완료', result);
  }

  @Get('skills')
  async getSkillTypes(): Promise<ApiSuccessResponse<SkillTypeListResult>> {
    const result = await this.commonService.getSkillTypes();
    return createSuccessResponse('스킬 목록 조회 완료', result);
  }
}
```

인증 Guard 없음 — 두 API 모두 public.

---

## 모듈 정의

### src/modules/common/common.module.ts

기존 `skills.module.ts` 패턴을 따른다 (`useExisting` 방식).

```typescript
@Module({
  providers: [
    CommonService,
    CommonPrismaRepository,
    {
      provide: COMMON_REPOSITORY,
      useExisting: CommonPrismaRepository,
    },
  ],
  exports: [CommonService],
})
export class CommonModule {}
```

### src/app.module.ts 수정 범위

imports 배열에 `CommonModule`을 추가한다. 기존 배열 순서를 유지하고 CommonModule을 추가하는 최소 변경만 수행한다.

```typescript
// 변경 전
imports: [PrismaModule, SpacesModule, AuthModule, NotificationsModule, SongsModule, UsersModule, BandsModule]

// 변경 후
imports: [PrismaModule, SpacesModule, AuthModule, NotificationsModule, SongsModule, UsersModule, BandsModule, CommonModule]
```

---

## 트랜잭션 경계

CommonService는 PrismaService를 주입받지 않는다 — `$transaction` 진입 불필요. 단일 쿼리이므로 Service 레벨에서 트랜잭션을 새로 열 이유가 없다.

| 메서드 | tx? 인자 | $transaction 진입 | 외부 tx 전달 |
|--------|:--------:|:-----------------:|:------------:|
| CommonService.getGenres | ✅ | ❌ | ✅ Repository에 전달 |
| CommonService.getSkillTypes | ✅ | ❌ | ✅ Repository에 전달 |
| CommonPrismaRepository.findAllGenres | ✅ | ❌ (단일 쿼리) | ✅ `client = tx ?? this.prisma` |
| CommonPrismaRepository.findAllSkillTypes | ✅ | ❌ (단일 쿼리) | ✅ `client = tx ?? this.prisma` |

---

## 테스트 계획

### common.service.spec.ts

패턴: 손으로 만든 Repository Stub + `new CommonService(repository)`.
CommonService는 PrismaService를 주입받지 않으므로 PrismaService Stub 불필요.

```
// Stub 구조 예시
function createCommonRepositoryStub(options?: {
  genreListResult?: GenreListResult;
  skillTypeListResult?: SkillTypeListResult;
  onFindAllGenres?: (tx: unknown) => void;
  onFindAllSkillTypes?: (tx: unknown) => void;
}): CommonRepository { ... }
```

| 메서드 | 케이스 | 패턴 |
|--------|--------|------|
| getGenres | happy path — genres 배열 반환 | Stub 기본값 사용 |
| getGenres | 빈 목록 반환 — 예외 없이 빈 배열 반환 | `genreListResult: { genres: [] }` |
| getGenres | 외부 tx 전달 시 repository에 동일 tx 전달 | `onFindAllGenres` 콜백으로 tx 캡처 후 `toBe` 검증 |
| getSkillTypes | happy path — skills 배열 반환 | Stub 기본값 사용 |
| getSkillTypes | 빈 목록 반환 — 예외 없이 빈 배열 반환 | `skillTypeListResult: { skills: [] }` |
| getSkillTypes | 외부 tx 전달 시 repository에 동일 tx 전달 | `onFindAllSkillTypes` 콜백으로 tx 캡처 후 `toBe` 검증 |

참고: NotFoundException / ForbiddenException / BadRequestException / 트랜잭션 일관성(복수 호출) 케이스는 해당 비즈니스 로직이 없으므로 생략한다.

### common.prisma-repository.spec.ts

패턴: `new CommonPrismaRepository(mockPrisma)` — Repository 단위 테스트. `findMany` 호출과 결과 매핑을 검증한다.

```typescript
const createPrismaMock = () => ({
  genre: { findMany: jest.fn() },
  skillType: { findMany: jest.fn() },
});
```

| 메서드 | 케이스 | 검증 포인트 |
|--------|--------|-------------|
| findAllGenres | happy path — 매핑 결과 반환 | `findMany` 호출 인자(select, orderBy), `id → genreId` 필드 변환 |
| findAllGenres | tx 전달 시 tx 클라이언트 사용 | `tx.genre.findMany` 호출, `prisma.genre.findMany` 미호출 |
| findAllSkillTypes | happy path — 매핑 결과 반환 | `findMany` 호출 인자(select, orderBy), `id → skillTypeId` 필드 변환 |
| findAllSkillTypes | tx 전달 시 tx 클라이언트 사용 | `tx.skillType.findMany` 호출, `prisma.skillType.findMany` 미호출 |

---

## 미결 사항

없음.

---

## 설계 품질 기준 체크

- [x] Service 메서드마다 예외 조건이 명시되었는가? — 예외 없음 명시
- [x] Repository 메서드가 인터페이스에 선언되었는가? — `CommonRepository` 인터페이스에 JSDoc 포함
- [x] 트랜잭션 경계가 명확한가? — PrismaService 불필요 이유, `client = tx ?? this.prisma` 패턴 명시
- [x] 테스트 케이스가 happy path + tx 일관성 + 외부 tx를 포함하는가? — 포함. NotFoundException 등 해당 없는 항목은 생략 이유 명시
- [x] PrismaRepository 테스트 패턴(`new Repository(mockPrisma)`)이 명시되었는가? — 명시
- [x] Prisma 모델과 설계가 일치하는가? — `Genre.id`, `SkillType.id` 확인, `deletedAt` 없음 확인
- [x] app.module.ts 수정 범위가 명시되었는가? — CommonModule import 추가 명시

---

## API 명세 위치

`docs/backend/api-docs/common.md`
