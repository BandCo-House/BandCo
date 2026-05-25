# /review — 코드 리뷰

변경된 코드를 아래 체크리스트로 검증한다.

## 1. 준비

```bash
git diff --name-only HEAD
```

변경 파일 목록을 확인하고, 관련 파일을 읽는다.
작업한 모듈의 `docs/modules/<모듈>.md`가 있으면 함께 읽는다.

---

## 2. 체크리스트

### 아키텍처
- [ ] Service는 Repository 인터페이스에만 의존하는가? (`PrismaService` 직접 주입 여부 확인)
- [ ] 새 Repository 메서드가 있다면 인터페이스(`*.repository.ts`)에도 선언했는가?
- [ ] 컨트롤러가 `ApiSuccessResponse<T>`로 응답을 감쌌는가?

### 트랜잭션
- [ ] 새 service 메서드가 `tx?: Prisma.TransactionClient`를 받는가?
- [ ] 외부 tx를 모든 repository 호출에 전달하는가?
- [ ] 외부 tx가 있을 때 새 `$transaction`을 열지 않는가?

### 테스트
- [ ] 새 service 메서드마다 `.spec.ts` 테스트가 있는가?
- [ ] happy path, NotFoundException, ForbiddenException, BadRequestException을 모두 커버하는가?
- [ ] 트랜잭션 일관성 테스트가 있는가? (`capturedTransactions` 패턴)
- [ ] 외부 tx 전달 테스트가 있는가? (`createPrismaServiceFailingTransactionStub` 사용)
- [ ] `jest.fn()` 또는 `TestingModule`을 service 테스트에 사용하지 않았는가? (auth 제외)

### 빌드 & 린트
```bash
pnpm run lint
pnpm run build
pnpm run test
```

---

## 3. 결과 출력

| 항목 | 결과 | 비고 |
|------|------|------|
| 아키텍처 (의존성 방향) | ✅/❌ | |
| 아키텍처 (API 응답 래핑) | ✅/❌ | |
| 트랜잭션 패턴 | ✅/❌ | |
| 테스트 존재 | ✅/❌ | |
| 테스트 커버리지 (예외 케이스) | ✅/❌ | |
| 테스트 커버리지 (tx 검증) | ✅/❌ | |
| lint | ✅/❌ | |
| build | ✅/❌ | |
| test | ✅/❌ | |

위반 사항이 있으면 수정 방안을 구체적으로 제시한다.

---

## 4. 하네스 개선 기회

리뷰 중 발견한 것 중 **하네스 문서에 없는 규칙·패턴·예외**가 있으면 기록한다.

```
docs/IMPROVEMENTS.md에 추가:
- 대상: <CLAUDE.md | docs/testing.md | docs/modules/xxx.md | docs/conventions.md>
- 내용: <무엇을 추가하면 좋은지>
- 발견 맥락: <어떤 상황에서 발견했는지>
```
