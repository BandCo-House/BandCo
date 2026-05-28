# /review-be — Backend 코드 리뷰

## 1. 준비

```bash
git diff --name-only HEAD
```

변경 파일 목록을 확인하고 관련 파일을 읽는다.
작업한 모듈이 있으면 `docs/backend/modules/<모듈>.md`를 함께 읽는다.

---

## 2. 체크리스트

### 코드 품질
- [ ] 설명할 수 없는 코드가 없는가?
- [ ] 요청받지 않은 기능·추상화·유연성이 추가되지 않았는가?
- [ ] 관련 없는 주변 코드를 임의로 수정하지 않았는가?
- [ ] 발생할 수 없는 상황을 위한 예외 처리가 없는가?

### 레이어 아키텍처
- [ ] Service가 Repository 인터페이스에만 의존하는가? (`PrismaService` 직접 주입 여부 확인)
- [ ] Controller가 `ApiSuccessResponse<T>`로 응답을 감쌌는가? Prisma 객체를 직접 반환하지 않는가?
- [ ] 새 Repository 메서드가 있다면 인터페이스(`*.repository.ts`)에도 선언했는가?
- [ ] 비즈니스 로직이 Controller에 없는가?

### 트랜잭션
- [ ] 새 Service 메서드가 `tx?: Prisma.TransactionClient`를 마지막 인자로 받는가?
- [ ] 모든 repository 호출에 tx를 전달하는가?
- [ ] 외부 tx가 있을 때 새 `$transaction`을 열지 않는가?

### 테스트
- [ ] 새 Service 메서드마다 `.spec.ts` 테스트가 있는가? (Controller 테스트는 불필요)
- [ ] happy path, NotFoundException, ForbiddenException, BadRequestException을 커버하는가?
- [ ] 트랜잭션 일관성 테스트가 있는가? (`capturedTransactions` 패턴)
- [ ] 외부 tx 전달 테스트가 있는가? (`createPrismaServiceFailingTransactionStub` 사용)
- [ ] Service 테스트에 `jest.fn()` 또는 `TestingModule`을 사용하지 않았는가? (auth 제외)

### 주석
- [ ] 주석이 있다면 한국어로 작성했는가?
- [ ] 중요 함수에 JSDoc 스타일 주석을 작성했는가?

### DTO 및 타입
- [ ] 요청 DTO에 class-validator 데코레이터가 있는가? (`@IsString()`, `@IsNotEmpty()` 등)
- [ ] Service 내부 반환 타입이 `types/{name}.type.ts`에 정의되었는가? (DTO에 넣지 않음)
- [ ] 복잡한 로직 검증 (`from > to` 같은 비교)은 DTO가 아닌 Service에서 처리하는가?

### Soft Delete
- [ ] `Band`, `User`, `BandSpace` 등 `deletedAt`이 있는 모델을 조회할 때 `where: { deletedAt: null }` 조건이 포함되었는가?
- [ ] 신규 모델에 불필요하게 `deletedAt`이 추가되지 않았는가?

### Prisma 및 파일 구조
- [ ] Prisma import가 `src/generated/prisma`를 사용하는가?
- [ ] Repository가 인터페이스(`*.repository.ts`)와 구현체(`*.prisma-repository.ts`)로 분리되었는가?
- [ ] 타입 파일이 `<name>.type.ts` 형식인가?

### 빌드 & 린트
```bash
pnpm run lint
pnpm run build
pnpm run test
```

---

## 3. 결과 출력

| 항목 | 결과 | 비고 |
|------|:----:|------|
| 코드 품질 (단순함·외과적 변경) | ✅/❌ | |
| 레이어 아키텍처 | ✅/❌ | |
| 트랜잭션 패턴 | ✅/❌ | |
| 테스트 존재 | ✅/❌ | |
| 테스트 커버리지 (예외 + tx) | ✅/❌ | |
| 주석 규칙 | ✅/❌ | |
| DTO class-validator 데코레이터 | ✅/❌ | |
| 반환 타입 types/*.type.ts 위치 | ✅/❌ | |
| soft-delete deletedAt:null 조건 | ✅/❌ | |
| Prisma import 경로 | ✅/❌ | |
| lint | ✅/❌ | |
| build | ✅/❌ | |
| test | ✅/❌ | |

위반 사항은 "X를 하지 마라. 이유: Y" 형식으로 수정 방안을 제시한다.

---

## 4. 하네스 개선 기회

리뷰 중 하네스 문서에 없는 규칙·패턴·예외를 발견하면 기록한다.

```
docs/IMPROVEMENTS.md Backlog에 추가:
| 우선순위 | 대상 파일 | 내용 | 발견 맥락 |
```
