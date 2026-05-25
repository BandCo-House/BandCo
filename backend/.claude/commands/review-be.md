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
