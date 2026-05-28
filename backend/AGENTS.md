# JamPlay Harness

## 현재 작업 범위

- **Backend** (활성): 이 CLAUDE.md가 기본 적용
- **Frontend** (예정): 추가 시 `docs/frontend/` 생성 후 이 파일에 섹션 추가

---

## DB 스키마

**단일 진실 공급원:** `prisma/schema.prisma`

모듈 doc의 스키마 발췌는 참고용이다. 실제 파일이 항상 우선한다.

---

## 행동 원칙

**구현 전**

- 가정하지 말고 명시하라. 여러 해석이 가능하면 조용히 하나를 고르지 말고 제시하라.
- 불확실하면 질문하라. 이해되지 않으면 멈추고 무엇이 혼란스러운지 말하라.
- 더 단순한 접근이 있으면 반드시 언급하라. 사용자 요청에 반대 의견이 있으면 이유와 함께 제시하라.

**코드 작성**

- 요청된 문제를 해결하는 최소한의 코드만 작성하라. 요청받지 않은 기능·유연성·설정 추가 금지.
- "시니어 개발자가 보기에 과하게 복잡한가?"를 항상 확인하라.
- 반드시 필요한 부분만 수정하라. 주변 코드·주석·포맷 임의 개선 금지.
- 설명할 수 없는 코드는 작성하지 마라.

**검증**

- 작업을 검증 가능한 목표로 바꿔 수행하라.
- 성공 기준이 "동작하게 만들기"처럼 약하면 명확히 질문하라.

---

## 명령어

```bash
# 빌드·테스트
sh ./scripts/verify.sh            # lint → format:check → build → test 전체 검증
pnpm run test                    # 단위 테스트
pnpm run lint / lint:fix         # ESLint
pnpm run format:check            # Prettier 검사
pnpm run build                   # TypeScript 컴파일

# Prisma
pnpm run prisma:generate         # 스키마 변경 후 클라이언트 재생성 ← 스키마 수정 시 필수
pnpm run prisma:validate         # 스키마 유효성 검사
pnpm run prisma:format           # 스키마 파일 포맷
pnpm run prisma:migrate:dev      # 마이그레이션 생성 + 적용 (dev)
pnpm run prisma:seed             # 시드 데이터 삽입
pnpm run prisma:studio           # Prisma Studio UI 실행
# prisma:migrate:deploy — production 전용, Agent가 직접 실행 금지

# Git / GitHub (jamplay/ 기준 — 터미널 직접 실행용)
pnpm run commit                  # Commitizen 인터랙티브 커밋
```

슬래시 커맨드: `/commit` — 커밋 | `/pr` — Draft PR 생성

패키지 매니저: **pnpm만** 사용한다.

---

## 하네스 강제 정책

- 작업은 항상 현재 하네스 규칙을 기준으로 수행한다.
- 변경 후 검증은 반드시 통과해야 하며, 통과하지 못하면 결과를 확정하지 않고 수정 또는 중단한다.
- Stop 훅과 최종 검증은 `sh ./scripts/verify.sh`를 실행한다.
- 검증에 실패하면 작업을 완료 상태로 만들지 않는다.
- 하네스 규칙과 기존 코드가 충돌하면, **하네스를 우선 적용**하고 충돌 지점을 현재 작업 범위에서 최소 변경으로 정리한다.

---

## 기존 코드와의 충돌 시 우선순위

1. 하네스 규칙 우선
2. 현재 작업 범위에서 필요한 최소 수정만 적용
3. 충돌이 있는 기존 패턴은 현재 작업에서 하네스에 맞게 정리
4. 충돌 원인은 `docs/IMPROVEMENTS.md`의 "기존 코드 충돌 지점"에 기록한다

---

## Backend 모듈 작업 시 읽을 파일

**작업 시작 전 해당 모듈 doc 하나만 읽는다. 그게 전부다.**

| 모듈          | 문서                                                                           |
| ------------- | ------------------------------------------------------------------------------ |
| auth          | [docs/backend/modules/auth.md](docs/backend/modules/auth.md)                   |
| users         | [docs/backend/modules/users.md](docs/backend/modules/users.md)                 |
| bands         | [docs/backend/modules/bands.md](docs/backend/modules/bands.md)                 |
| spaces        | [docs/backend/modules/spaces.md](docs/backend/modules/spaces.md)               |
| songs         | [docs/backend/modules/songs.md](docs/backend/modules/songs.md)                 |
| notifications | [docs/backend/modules/notifications.md](docs/backend/modules/notifications.md) |
| skills        | [docs/backend/modules/skills.md](docs/backend/modules/skills.md)               |

필요할 때만 추가로 읽는다:

- 테스트 패턴이 헷갈릴 때: [docs/backend/testing.md](docs/backend/testing.md)
- 코딩 컨벤션이 헷갈릴 때: [docs/backend/conventions.md](docs/backend/conventions.md)

상황별 참고 문서:

- 특정 도메인 모듈을 구현·수정·리뷰할 때: 위 표의 [docs/backend/modules/](docs/backend/modules/) 문서 중 해당 모듈 문서
- 새 도메인 모듈을 추가할 때: [docs/backend/conventions.md](docs/backend/conventions.md), [docs/backend/testing.md](docs/backend/testing.md), `prisma/schema.prisma`, 가장 유사한 기존 모듈 문서를 먼저 읽고 [docs/backend/modules/](docs/backend/modules/)에 새 모듈 설계 문서를 작성한다.
- API 엔드포인트, 요청/응답 DTO, 응답 예시, 명세를 작성·수정할 때: [docs/backend/api-docs/](docs/backend/api-docs/)
- 테스트를 작성·수정하거나 테스트 실패를 분석할 때: [docs/backend/testing.md](docs/backend/testing.md)
- 레이어 책임, 네이밍, 응답 형식 등 구현 컨벤션을 확인할 때: [docs/backend/conventions.md](docs/backend/conventions.md)
- Git, 커밋, PR 흐름을 확인할 때: [docs/git.md](docs/git.md)
- 하네스 규칙에 빠진 내용이나 개선점을 발견했을 때: [docs/IMPROVEMENTS.md](docs/IMPROVEMENTS.md)

새 모듈 설계 문서는 기존 `docs/backend/modules/*.md` 형식을 참고해 최소한 다음을 포함한다:

- 모듈 경로와 파일 목록
- Repository 인터페이스
- Service 비즈니스 규칙
- 관련 DB 모델 또는 `prisma/schema.prisma` 기준 링크
- 테스트 Stub 또는 핵심 테스트 케이스
- API가 있으면 [docs/backend/api-docs/](docs/backend/api-docs/)의 명세 위치

---

## Backend 필수 규칙

**테스트**

- 새 Service 메서드 → 반드시 `.spec.ts` 테스트 동시 작성
- Controller는 테스트하지 않는다. Service·Repository·핵심 유틸만.
- 패턴: 손으로 만든 Repository Stub (jest.fn(), TestingModule 금지 — auth 제외)
- 커버: happy path / NotFoundException / ForbiddenException / BadRequestException / tx 일관성 / 외부 tx 전달

**API 응답**

- 컨트롤러는 반드시 `ApiSuccessResponse<T>`로 감싼다. Prisma 객체 직접 반환 절대 금지.

**의존성**

- Service → Repository **인터페이스**에만 의존. `@Inject(SYMBOL)` 사용.
- `PrismaService`는 `$transaction` 진입점으로만 사용한다.

**트랜잭션**

- 모든 Service 메서드는 `tx?: Prisma.TransactionClient`를 마지막 선택 인자로 받는다.
- 외부 tx가 있으면 새 `$transaction`을 열지 않고 그대로 전달한다.

**주석**

- 모든 주석은 한국어로 작성한다.
- 중요한 함수에는 JSDoc 스타일 주석을 작성한다.

---

## 하네스 개선

작업 중 문서에 빠진 규칙·패턴을 발견하면:
→ [docs/IMPROVEMENTS.md](docs/IMPROVEMENTS.md)에 기록한다.
