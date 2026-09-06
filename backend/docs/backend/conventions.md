# Backend 코딩 컨벤션

---

## 1. 최우선 원칙

- 설명할 수 없는 코드는 작성하지 않는다.
- 단순 변환 외의 비즈니스 로직은 Service에서 처리한다.
- 기존 코드 스타일을 최대한 참고해서 작성한다.
- 속도보다 신중함을 우선한다. 단, 사소한 작업은 작업 규모에 맞게 판단한다.

### 1.1 구현 전 판단

- 가정하지 말고, 혼란을 숨기지 말고, 트레이드오프를 드러낸다.
- 구현 전에는 명시적으로 가정을 설명한다.
- 불확실한 부분이 있으면 질문한다.
- 여러 해석이 가능하면 조용히 하나를 고르지 말고 가능한 해석을 제시한다.
- 더 단순한 접근이 있으면 반드시 언급한다.
- 필요한 경우 사용자 요청에 반대 의견을 제시하되, 이유를 설명한다.
- 이해되지 않는 부분이 있으면 멈추고, 무엇이 혼란스러운지 말한 뒤 질문한다.

### 1.2 단순함 우선

- 요청받은 문제를 해결하는 최소한의 코드만 작성한다.
- 요청받지 않은 기능을 추가하지 않는다.
- 한 번만 쓰이는 코드를 위해 추상화를 만들지 않는다.
- 요청받지 않은 유연성이나 설정 가능성을 추가하지 않는다.
- 발생할 수 없는 상황을 위한 예외 처리를 추가하지 않는다.
- 200줄로 작성한 코드가 50줄로 충분하다면 다시 단순하게 작성한다.
- "시니어 개발자가 보기에 과하게 복잡한가?"를 항상 확인하고, 그렇다면 단순화한다.

### 1.3 외과적 변경

- 반드시 필요한 부분만 수정한다.
- 주변 코드, 주석, 포맷을 임의로 개선하지 않는다.
- 고장 나지 않은 코드를 리팩터링하지 않는다.
- 선호하는 방식이 아니더라도 기존 스타일을 따른다.
- 관련 없는 죽은 코드를 발견하면 삭제하지 말고 언급만 한다.
- 본인이 만든 변경으로 사용되지 않게 된 import, 변수, 함수만 제거한다.
- 기존에 있던 미사용 코드는 요청받지 않았다면 제거하지 않는다.
- 변경한 모든 줄은 사용자 요청과 직접 연결되어야 한다.

### 1.4 목표 기반 실행

- 작업을 검증 가능한 목표로 바꿔서 수행한다.
- "검증 추가" 요청은 잘못된 입력에 대한 테스트를 작성하고 통과시키는 것으로 정의한다.
- "버그 수정" 요청은 버그를 재현하는 테스트를 작성하고 통과시키는 것으로 정의한다.
- "리팩터링" 요청은 변경 전후 테스트 통과를 확인하는 것으로 정의한다.
- 여러 단계가 필요한 작업은 간단한 계획을 먼저 제시한다.

```
1. [단계] -> 검증: [확인 방법]
2. [단계] -> 검증: [확인 방법]
```

- 성공 기준이 명확하면 독립적으로 반복하며 완료한다.
- 성공 기준이 "동작하게 만들기"처럼 약하면 계속 구현하지 말고 명확히 질문한다.

---

## 2. 명시적인 코드 작성

### 2.1 명시성이 암시성보다 우선

- 암묵적인 동작, 매직 넘버, 축약 표현을 피한다.
- 중첩 삼항 연산자, 한 줄 조건문, 의미가 숨겨진 로직을 금지한다.
- 조건문과 로직 흐름은 명확하게 드러나야 한다.

### 2.2 단계별 로직 분리

- 복잡한 로직은 반드시 여러 단계로 나눈다.
- 각 단계는 변수명만 봐도 역할이 드러나야 한다.
- "이 변수가 왜 필요한지"가 코드에서 보이도록 작성한다.

---

## 3. 레이어 책임

### 3.1 Controller

- 요청/응답 처리만 담당한다.
- 단순 데이터 전달만 수행한다.
- 모든 응답은 `ApiSuccessResponse<T>`로 감싼다. Prisma 객체 직접 반환 절대 금지.
- 실패 응답은 컨트롤러가 만들지 않는다. 예외를 던지면 글로벌 `ApiExceptionFilter`가 `ApiFailResponse`(`status: 'fail'`, `error.code`는 HTTP 상태 이름, `message`는 사용자 노출 문구)로 통일한다.
- 불필요한 Exception 사용을 금지한다.
- 의미 있는 예외만 허용한다. (예: 파일 업로드 요청에서 파일이 없는 경우)

### 3.2 Service

- 비즈니스 로직을 처리한다.
- 조건 분기, 검증, DB 접근 흐름을 담당한다.
- DTO에서 처리하기 과한 검증은 Service에서 처리한다. (예: `from > to` 같은 로직 검증)
- Repository **인터페이스**에만 의존한다. `PrismaService`를 직접 주입받지 않는다.
- `PrismaService`는 `$transaction` 진입점으로만 사용한다.
- 특정 도메인 로직은 해당 Service를 주입받아 사용한다.

```typescript
// 트랜잭션 패턴
async doSomething(input: Input, tx?: Prisma.TransactionClient): Promise<Result> {
  const run = async (client: Prisma.TransactionClient): Promise<Result> => {
    const entity = await this.repo.findById(input.id, client);
    return await this.repo.create(input, client);
  };
  return tx ? run(tx) : this.prisma.$transaction(run);
}
```

### 3.3 Repository

- Prisma 함수 기반으로 작성한다.
- DB 접근만 담당한다. 비즈니스 로직을 작성하지 않는다.
- 인터페이스(`*.repository.ts`)와 구현체(`*.prisma-repository.ts`)를 분리한다.
- 심볼 토큰(`FEATURE_REPOSITORY`)으로 DI 등록한다.

```typescript
// repository.ts
export const FEATURE_REPOSITORY = Symbol('FEATURE_REPOSITORY');
export interface FeatureRepository { ... }

// feature.module.ts
{ provide: FEATURE_REPOSITORY, useClass: FeaturePrismaRepository }

// feature.service.ts
constructor(@Inject(FEATURE_REPOSITORY) private readonly repo: FeatureRepository) {}
```

---

## 4. DTO 규칙

- 모든 데이터는 DTO로 감싼다.
- 단순 구조 검증은 DTO에서 수행한다 (`class-validator` 데코레이터).
- 복잡한 로직 검증은 Service에서 수행한다.
- 검증 메시지는 `src/common/validation-message/` 헬퍼를 사용한다.
- DTO는 요청 파싱 전용. Service 내부 반환 타입은 `types/`에 별도 정의한다.

---

## 5. 네이밍 컨벤션

### 기본 원칙

- 명확한 동사 + 명사 구조를 사용한다.
- camelCase를 사용한다.

### 권장 동사

- create / find / update / delete
- CRUD보다 구체적인 함수명 사용을 권장한다.
- Controller와 Service의 함수명이 동일해도 허용한다.

| 대상 | 규칙 | 예시 |
|------|------|------|
| 파일 | kebab-case | `bands.service.ts` |
| 클래스 | PascalCase | `BandsService` |
| 인터페이스 | PascalCase (I 접두사 없음) | `BandsRepository` |
| 심볼 토큰 | SCREAMING_SNAKE_CASE | `BANDS_REPOSITORY` |
| 타입 파일 | `<name>.type.ts` | `create-band-result.type.ts` |
| 테스트 설명 | 한국어 서술형 | `'밴드장이 요청하면 삭제된다'` |

---

## 6. 주석 규칙

- **모든 주석은 한국어로 작성한다.** 영어 주석 금지.
- 주석은 "무엇을 하는지"보다 **"왜 존재하는지"를 설명한다.**
- 중요한 함수에는 JSDoc 스타일 주석을 작성한다.

```typescript
/**
 * 인증 사용자를 밴드장으로 삼아 밴드 생성 정책을 검증하고 저장을 위임한다.
 *
 * @param {string} bandMasterUserId - 인증된 사용자 ID
 * @param {CreateBandInput} input - 검증이 끝난 밴드 생성 요청값
 * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
 * @returns {Promise<CreateBandResult>} 밴드 생성 응답 데이터
 */
async createBand(bandMasterUserId: string, input: CreateBandInput, tx?: Prisma.TransactionClient): Promise<CreateBandResult>
```

---

## 7. 예외 처리

### 사용 가능한 예외 (이 목록 우선 사용)

```
BadRequestException    잘못된 입력, 중복, 비즈니스 규칙 위반
UnauthorizedException  인증 실패
ForbiddenException     권한 없음
NotFoundException      리소스 없음 또는 soft-delete됨
NotAcceptableException
RequestTimeoutException
ConflictException
```

### 메시지 규칙

- "왜 실패했는지" 명확하게 작성한다.
- validation 메시지는 `src/common/validation-message/`에서 중앙 관리한다.

---

## 8. Soft Delete

- **기본: 사용하지 않는다.** 신규 모델은 특별한 이유 없이 `deletedAt` 추가 금지.
- 필요하면 사용 기준을 명확히 정의한 뒤 사용한다.
- 기존 코드(`Band`, `User`, `BandSpace`)에는 `deletedAt`이 있다. 조회 시 반드시 `deletedAt: null` 조건을 포함한다.

---

## 9. Prisma 규칙

- Prisma 클라이언트는 `src/generated/prisma`에 생성됨 (기본 경로 아님).
- 스키마 변경 후 반드시 `pnpm run prisma:generate` 실행.
- `generated/` 디렉터리는 git에 커밋하지 않는다.

---

## 10. Swagger 데코레이터

- **Controller**: 모든 Controller 클래스에 `@ApiTags`, 모든 핸들러 메서드에 `@ApiOperation`과 `@ApiResponse`를 반드시 추가한다.
- **DTO**: 요청 DTO의 모든 public 필드에 `@ApiProperty`를 반드시 추가한다.
- `@ApiResponse`에는 최소한 성공 케이스(2xx)와 주요 실패 케이스(400/401/403/404)를 명시한다.

```typescript
// Controller 예시
@ApiTags('밴드')
@Controller('bands')
export class BandsController {
  @Post()
  @ApiOperation({ summary: '밴드 생성' })
  @ApiResponse({ status: 201, description: '밴드 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async createBand(@Body() dto: CreateBandDto) { ... }
}

// DTO 예시
export class CreateBandDto {
  @ApiProperty({ description: '밴드 이름', example: '락밴드' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
```
