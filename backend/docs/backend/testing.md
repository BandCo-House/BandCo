# Backend 테스트 가이드

## 실행

```bash
cd jamplay/backend
pnpm run test              # 전체 실행
pnpm run test -- --watch   # 감시 모드
pnpm run test -- bands     # 특정 파일 필터
```

---

## 테스트 대상 레이어

| 레이어 | 테스트 여부 | 이유 |
|--------|:---------:|------|
| Controller | ❌ | 요청/응답 전달만 담당. 비즈니스 로직 없음 |
| Service | ✅ 필수 | 비즈니스 로직·검증·분기의 핵심 레이어 |
| Repository | ✅ 조건부 | 복잡한 Prisma 쿼리(다중 조인, 조건부 include)만 |
| Guard | ✅ 조건부 | 인증·권한 로직이 있는 Guard |
| 유틸 함수 | ✅ 한정적 | 중요한 순수 함수만 |

---

## 1. Service 단위 테스트

**패턴: 손으로 만든 Repository Stub**

NestJS `TestingModule`, `jest.mock()`, `jest.fn()` 사용 금지.
Service를 직접 `new`로 생성한다.

```typescript
// ─── UUID 상수 (파일 상단에 모아 선언) ───────────────────────────
const USER_ID    = '11111111-1111-4111-8111-111111111111';
const BAND_ID    = '22222222-2222-4222-8222-222222222222';

// ─── Repository Stub ─────────────────────────────────────────────
function createXxxRepositoryStub(options?: {
  existingEntity?: Entity | null;           // 반환값 오버라이드
  onSomeMethod?: (arg: Type, tx: unknown) => void; // 호출 관찰
}): XxxRepository {
  return {
    async someMethod(arg, tx) {
      options?.onSomeMethod?.(arg, tx);
      if (options?.existingEntity !== undefined) return options.existingEntity;
      return DEFAULT_ENTITY;
    },
  };
}

// ─── PrismaService Stub ──────────────────────────────────────────
function createPrismaServiceStub(): PrismaService {
  const tx = { transactionClient: true };
  return {
    async $transaction(callback) { return callback(tx); },
  } as PrismaService;
}

// 외부 tx 전달 검증용: $transaction을 호출하면 무조건 실패
function createPrismaServiceFailingTransactionStub(): PrismaService {
  return {
    async $transaction() {
      throw new Error('외부 tx가 있으면 새 transaction을 열지 않아야 합니다.');
    },
  } as unknown as PrismaService;
}

// ─── 테스트 ──────────────────────────────────────────────────────
describe('XxxService', () => {
  describe('someMethod', () => {
    it('설명 (한국어)', async () => {
      const repository = createXxxRepositoryStub({ ... });
      const service = new XxxService(repository, createPrismaServiceStub());
      const result = await service.someMethod(...);
      expect(result).toEqual(...);
    });
  });
});
```

**예외: Auth 모듈.** JwtService 등 외부 의존성이 복잡하므로 `TestingModule` + `jest.fn()` 허용.

---

## 2. Repository 단위 테스트

**패턴: Prisma 클라이언트 Jest Mock**

복잡한 쿼리(다중 조인, 조건부 include, 커서 기반 페이지네이션)가 있는 Repository만 작성한다.

```typescript
const createPrismaMock = () => ({
  modelName: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
});

describe('XxxPrismaRepository', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let repository: XxxPrismaRepository;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new XxxPrismaRepository(prisma as unknown as PrismaService);
  });

  it('삭제되지 않은 엔티티를 조회한다', async () => {
    prisma.modelName.findFirst.mockResolvedValue({ id: 'xxx' });
    const result = await repository.findById('xxx');
    expect(result).toEqual({ id: 'xxx' });
  });
});
```

---

## 필수 커버리지 체크리스트

새 Service 메서드마다 아래 항목을 작성한다. 해당 시나리오가 없는 경우만 생략한다.

- [ ] **Happy path** — 정상 흐름에서 올바른 결과를 반환한다
- [ ] **NotFoundException** — 리소스 없음 또는 soft-delete됨
- [ ] **ForbiddenException** — 권한 없는 사용자의 작업
- [ ] **BadRequestException** — 잘못된 입력, 중복, 비즈니스 규칙 위반
- [ ] **트랜잭션 일관성** — 같은 tx client가 모든 repository 호출에 전달되는지 확인
- [ ] **외부 tx 전달** — 외부 tx가 있으면 새 `$transaction`을 열지 않음

---

## 트랜잭션 테스트 패턴

```typescript
it('검증과 생성을 같은 transaction client로 실행한다', async () => {
  const capturedTransactions: unknown[] = [];
  const repository = createXxxRepositoryStub({
    onValidate(tx) { capturedTransactions.push(tx); },
    onCreate(_input, tx) { capturedTransactions.push(tx); },
  });
  const service = new XxxService(repository, createPrismaServiceStub());

  await service.doSomething(...);

  expect(capturedTransactions).toHaveLength(2);
  expect(capturedTransactions[0]).toBe(capturedTransactions[1]);
});

it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
  const externalTx = { transactionClient: true };
  const capturedTransactions: unknown[] = [];
  const repository = createXxxRepositoryStub({
    onSomeMethod(_arg, tx) { capturedTransactions.push(tx); },
  });
  const service = new XxxService(repository, createPrismaServiceFailingTransactionStub());

  await service.doSomething(..., externalTx as never);

  expect(capturedTransactions[0]).toBe(externalTx);
});
```

---

## 작성 규칙

- 설명은 **한국어** 서술형으로 작성한다 (`it('밴드장이 요청하면 삭제된다', ...)`)
- 관찰 변수는 `captured` 접두사 (`capturedInput`, `capturedTransactions`)
- UUID 상수는 파일 상단에 모아 선언한다
- Stub 기본값은 happy path를 반환하고, `options`로 실패 시나리오를 오버라이드한다
- 테스트를 위한 테스트는 지양한다. 의미 있는 케이스(성공/실패/분기/예외)를 중심으로 작성한다
