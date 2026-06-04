---
name: be-qa
description: JamPlay 백엔드 구현의 품질을 검증하는 스킬. "QA 해줘", "검증해줘", "verify 실행해줘", "테스트 통과 확인", "하네스 규칙 점검", "코드 리뷰" 요청 시 트리거한다. be-orchestrate 스킬이 내부적으로 사용하며, 독립적으로도 트리거 가능하다. 구현하지 않고 검증과 보고만 수행한다.
---

# Be-QA — 백엔드 QA 검증 스킬

백엔드 구현이 하네스 규칙을 준수하는지 검증한다. 구현하지 않는다. 검증과 보고만 수행한다.

## 검증 프로세스

### Step 1: 규칙 문서 읽기

검증 기준이 되는 문서를 먼저 읽는다:

- `docs/backend/conventions.md` — 레이어 책임·DTO·soft delete·tx·네이밍 규칙
- `docs/backend/testing.md` — 테스트 패턴·필수 커버리지·Stub 작성 규칙

### Step 2: 변경 파일 확인

```bash
git diff --name-only HEAD
```

변경된 파일 목록을 확인하고 각 파일을 읽는다. 관련 모듈 doc이 있으면 설계 의도 파악을 위해 함께 읽는다.

### Step 3: 설계-구현 일치 확인

`_workspace/design.md`가 있으면 설계의 작업 범위, Repository 인터페이스, Service 비즈니스 규칙이 실제 구현과 일치하는지 확인한다.

### Step 4: 하네스 체크리스트

> Step 1에서 읽은 `conventions.md`와 `testing.md` 기준으로 검증한다. 아래는 Quick-reference 체크리스트다.

변경 파일을 읽고 각 항목을 검증한다. 문제가 있으면 `파일경로:라인번호` 형식으로 위치를 명시한다.

**아키텍처 레이어**

- [ ] Service가 `@Inject(SYMBOL)`로 Repository 인터페이스에만 의존하는가?
- [ ] `PrismaService`가 `$transaction` 진입점으로만 쓰였는가?
- [ ] Controller가 `ApiSuccessResponse<T>`로 응답을 감쌌는가?
- [ ] Prisma 객체를 Controller에서 직접 반환하지 않는가?
- [ ] 비즈니스 로직이 Controller에 없는가?

**트랜잭션**

- [ ] 새 Service 메서드가 `tx?: Prisma.TransactionClient`를 마지막 인자로 받는가?
- [ ] 모든 repository 호출에 tx를 전달하는가?
- [ ] 외부 tx가 있을 때 새 `$transaction`을 열지 않는가?

**테스트**

- [ ] 새 Service 메서드마다 `.spec.ts` 테스트가 있는가?
- [ ] happy path 케이스가 있는가?
- [ ] NotFoundException, ForbiddenException, BadRequestException 케이스가 있는가? (해당 시나리오가 있는 경우)
- [ ] `capturedTransactions` 패턴으로 tx 일관성을 검증하는가?
- [ ] `createPrismaServiceFailingTransactionStub`으로 외부 tx 전달을 검증하는가?
- [ ] `jest.fn()` 또는 `TestingModule`을 사용하지 않았는가? (auth 모듈 제외)
- [ ] Stub 기본값이 happy path를 반환하는가?

**DTO 및 타입**

- [ ] 요청 DTO에 class-validator 데코레이터가 있는가? (`@IsString()`, `@IsNotEmpty()` 등)
- [ ] Service 내부 반환 타입이 `types/{name}.type.ts`에 정의되었는가? (DTO에 넣지 않음)
- [ ] 복잡한 로직 검증 (`from > to` 같은 비교)은 DTO가 아닌 Service에서 처리하는가?

**Soft Delete**

- [ ] `Band`, `User`, `BandSpace` 등 `deletedAt`이 있는 모델을 조회할 때 `where: { deletedAt: null }` 조건이 포함되었는가?
- [ ] 신규 모델에 불필요하게 `deletedAt`이 추가되지 않았는가?

**Prisma**

- [ ] Prisma import가 `src/generated/prisma`를 사용하는가? (기본 경로 아님)
- [ ] 스키마 변경 후 `pnpm run prisma:generate`가 실행되었는가?

**네이밍 및 파일 구조**

- [ ] Repository가 인터페이스(`*.repository.ts`)와 구현체(`*.prisma-repository.ts`)로 분리되었는가?
- [ ] 파일명이 kebab-case인가? (`bands-service.ts` 등)
- [ ] 타입 파일이 `<name>.type.ts` 형식인가? (`create-band-result.type.ts` 등)

**Swagger**

- [ ] Controller 클래스에 `@ApiTags`가 있는가?
- [ ] 각 핸들러 메서드에 `@ApiOperation`과 `@ApiResponse`가 있는가?
- [ ] 요청 DTO의 모든 public 필드에 `@ApiProperty`가 있는가?

**코드 품질**

- [ ] 설명할 수 없는 코드가 없는가?
- [ ] 요청받지 않은 기능·추상화·유연성이 추가되지 않았는가?
- [ ] 관련 없는 코드를 임의로 수정하지 않았는가?
- [ ] 주석이 있다면 한국어로 작성했는가?
- [ ] 중요 함수에 JSDoc 스타일 주석이 있는가?

### Step 5: verify.sh 실행

```bash
sh ./scripts/verify.sh
```

lint → format:check → build → test 순서로 전체 검증한다. 실패 시 에러 메시지 전체를 QA 리포트에 포함한다.

## QA 리포트 형식

```markdown
## QA 리포트

### 설계-구현 일치

✅ 일치 / ❌ 불일치: [불일치 내용 상세]

### 체크리스트 결과

| 항목                                      | 결과  | 위치      |
| ----------------------------------------- | :---: | --------- |
| Service → Repository 인터페이스 의존      | ✅/❌ | 파일:라인 |
| PrismaService $transaction 진입점만 사용  | ✅/❌ | 파일:라인 |
| Controller ApiSuccessResponse 래핑        | ✅/❌ | 파일:라인 |
| tx? 마지막 인자                           | ✅/❌ | 파일:라인 |
| 외부 tx 전달 시 $transaction 미실행       | ✅/❌ | 파일:라인 |
| Service 테스트 존재                       | ✅/❌ | 파일:라인 |
| 테스트 커버리지 (예외 + tx)               | ✅/❌ | 파일:라인 |
| DTO class-validator 데코레이터            | ✅/❌ | 파일:라인 |
| 반환 타입 types/\*.type.ts 위치           | ✅/❌ | 파일:라인 |
| soft-delete 모델 deletedAt:null 조건      | ✅/❌ | 파일:라인 |
| Prisma import 경로 (src/generated/prisma) | ✅/❌ | 파일:라인 |
| 코드 품질 (단순함·외과적 변경)            | ✅/❌ | 파일:라인 |

### verify.sh 결과

✅ 통과 / ❌ 실패

실패 내용:
(에러 메시지)

### 수정 필요 항목

1. [파일경로:라인번호] 문제 내용 — 수정 방향
2. ...

### 판정

✅ QA 통과 / ❌ QA 실패 (수정 후 재실행 필요)
```
