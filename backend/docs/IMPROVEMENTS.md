# 하네스 발전 로그

구현 중 발견한 개선 기회를 여기에 기록한다.
구현을 멈출 필요 없다 — 작업 후 한 줄만 추가하면 된다.

---

## 루틴

```
발견 → IMPROVEMENTS.md Backlog에 추가
               ↓
       (주기적으로 검토)
               ↓
       Backlog → 실제 하네스 파일에 반영 → 적용 완료로 이동
```

**기록 기준**: 다음 번 같은 상황에서 agent가 실수를 반복하거나,
문서를 읽어도 판단이 어려웠던 것만 기록한다. 사소한 것은 생략.

---

## Backlog

> 아직 하네스에 반영되지 않은 개선 아이디어.

| 우선순위 | 대상 파일 | 내용 | 발견 맥락 |
|:-------:|----------|------|----------|
| 높음 | `.claude/agents/be-designer.md` | 설계 시 확인해야 할 구현 패턴 체크리스트 추가 필요: Controller 골격(`@Controller()` + 전체 경로, `AuthenticatedRequest`, `@UseGuards` 메서드별 적용), Module 등록(`AuthModule` import, `useExisting` 패턴), Service 생성자(`@Inject(SYMBOL)` + `PrismaService`), Prisma Record 타입(`Prisma.XxxGetPayload`), boolean query param Transform(`parseOptionalBooleanValue`). 현재는 "기존 모듈을 참고하라"고만 돼 있어 매번 코드 탐색으로 재발견해야 함. | places 모듈 설계 후 보완 작업 중 |
| 높음 | `docs/backend/conventions.md` | 새 모듈 추가 시 반드시 따라야 할 패턴 섹션 보강 필요: (1) Controller — `@Controller()` + 전체 경로 방식, `AuthenticatedRequest` 인터페이스 선언, `@UseGuards` 메서드별 적용, `createSuccessResponse` wrapping. (2) Module — `AuthModule` import 필수, `useExisting`으로 Repository 심볼 바인딩. (3) Query DTO — boolean 파라미터는 반드시 `parseOptionalBooleanValue` + `booleanValidationMessage` 적용. | places 모듈 초기 설계에서 위 패턴들이 누락되어 보완 작업 필요 |
| 중간 | `docs/backend/conventions.md` | 커서 기반 페이지네이션 `meta.next` URL 생성 방식 문서화 필요: `cursor__created_at={encodeURIComponent(item.createdAt)}&cursor__id={item.id}` 형태로 query string 직접 조합, bandId 등 경로 파라미터를 Repository 메서드에 전달해 next URL에 포함하는 패턴. | places 모듈 목록 조회 설계 중 next URL 생성 방식이 conventions에 없어 기존 코드 탐색으로 파악 |
| 중간 | `docs/backend/conventions.md` | ORDER_DIRECTIONS는 Prisma 호환을 위해 소문자(`'asc'`/`'desc'`)로 정의한다는 규칙 추가 필요. songs는 소문자, places는 대문자로 불일치 발생 — 대문자를 쓰면 repository에서 `.toLowerCase() as 'asc' \| 'desc'` 캐스트 우회가 필요해짐. | places 모듈 리뷰 중 |
| 낮음 | `.claude/agents/be-designer.md` | cursor__created_at 날짜 유효성 검사(`Number.isNaN`) 패턴을 Service 비즈니스 규칙 체크리스트에 추가. bands는 `validateCursorPair`에서 날짜 파싱 후 NaN 체크를 하는데 places에는 누락되어 잘못된 날짜가 Prisma에 전달될 수 있음. | bands와 places 비교 중 발견 |
| 높음 | `CLAUDE.md`, `.claude/agents/be-orchestrator.md` | 하네스 Phase 4(QA) 이후 PR 생성을 Phase 5로 추가해야 함. 현재는 QA 통과 후 설계 문서 보관으로 끝나는데, API 단위로 작업할 때 PR까지 생성하는 흐름이 표준화되어야 함. `/pr` 슬래시 커맨드 또는 `be-orchestrate` 스킬 마지막 단계에 PR 생성 안내를 포함하는 방식 검토. | places 모듈 전체 구현 완료 후 PR 생성이 흐름에서 빠져 있음을 발견 |
| 중간 | `src/modules/songs/songs.service.spec.ts` | 파일 전체가 손으로 만든 Repository Stub이 아닌 `jest.Mocked<SongsRepository>` + `jest.fn()` 패턴으로 작성되어 있어 "Backend 필수 규칙"(auth 제외 TestingModule/jest.fn() 금지)과 충돌. 곡 미디어 필드(songCoverUrl 등) 추가 작업에서는 기존 패턴에 값만 추가했고, 파일 전체를 Stub 패턴으로 재작성하는 것은 해당 작업 범위를 벗어나 별도 리팩터링으로 분리 필요. | 곡 생성/수정 API에 songCoverUrl·referenceFiles·externalLinks·songLength 추가 후 be-qa 검증 중 발견 |
| 중간 | `src/modules/users/repositoreis/user.prisma-repository.spec.ts`, `src/modules/notifications/repositories/notifications.prisma-repository.spec.ts`, `src/modules/notifications/notifications.service.spec.ts`, `src/modules/bandspaces/bandspaces.service.spec.ts` | 4개 spec의 `beforeEach`가 `Test.createTestingModule`로 의존성을 주입해 "Backend 필수 규칙"(auth 제외 TestingModule 금지)과 충돌. Repository/Service 생성자가 단순해 `new UsersPrismaRepository(mockPrisma)` 형태의 수동 주입으로 바꾸는 것 자체는 파일당 3~4줄이지만, 4개 파일에 걸쳐 있어 한 파일만 고치면 오히려 패턴이 갈라짐. 4개를 한 번에 정리하는 별도 PR로 분리 필요. | PR #149(회원가입 오류 수정) CodeRabbit 리뷰에서 `user.prisma-repository.spec.ts` 지적 — 해당 `beforeEach`는 이번 diff에서 건드리지 않은 기존 코드라 보류 |
| 높음 | `docs/backend/conventions.md` | `@db.SmallInt` 컬럼에는 DTO에도 `@Max(32767)`를 붙인다는 규칙 추가 필요. `bpm`·`songLength`가 `@Min(1)`만 있어 32767 초과 값이 검증을 통과한 뒤 DB에서 터져 400이 아니라 500이 났다. 컬럼 타입과 DTO 상한을 짝지어 보는 체크가 없으면 반복된다. | PR #158 CodeRabbit 리뷰 — 곡 생성/수정 DTO |
| 중간 | `docs/backend/conventions.md` | 한 벌로만 의미가 있는 optional 필드군은 `@IsOptional()` 대신 `@ValidateIf`로 all-or-nothing 검증한다는 규칙 추가 필요. `sourceUrl`·`sourceType`·`externalTrackId`가 각각 `@IsOptional()`이라 하나만 보내도 통과해 반쪽짜리 음원 출처가 저장될 수 있었다. | PR #158 CodeRabbit 리뷰 — 곡 생성 DTO |
| 중간 | `CLAUDE.md` | `prisma:generate`가 "스키마 수정 시 필수"로만 적혀 있는데, **리베이스·브랜치 전환 후에도 필요**하다는 안내 추가 필요. `src/generated/prisma`가 gitignore 대상이라 브랜치를 옮기면 이전 스키마의 클라이언트가 그대로 남아, enum 값이 없다는 컴파일 에러가 난다(원인 파악에 시간이 걸림). | KAN-78을 dev에 리베이스한 뒤 `SongKey.FSM` 컴파일 에러 |
| 낮음 | `docs/backend/api-docs/band.md`, `users.md` | API 번호 `#70`이 `GET /bands/{bandId}`(band.md)와 `POST /auth/login/google`(users.md)에 중복 부여됨. 신규 번호를 딸 때 문서 하나만 보고 최대값을 잡아서 생긴 충돌. be-design이 번호를 부여할 때 `api-docs/*.md` 전체에서 최대값을 확인하도록 규칙 추가 필요(강퇴 API는 전체 최대 기준 #71 사용). | FE–BE 계약 감사 중 발견 |
| 중간 | `docs/backend/api-docs/*.md` | 응답 예시가 전부 `"success": true` 형태인데 실제 `createSuccessResponse`는 `{ status: "success", error: null, message, data }`를 반환한다. 10개 문서 64개 예시가 실제 응답과 달라 프론트가 envelope을 잘못 파싱할 수 있다(실제로 프론트 `loginEmail`이 `success` 가정으로 작성돼 토큰을 못 읽는 버그가 있었음). be-api-sync가 예시를 생성할 때 `createSuccessResponse` 형태를 쓰도록 규칙 추가 필요. | PR #171 CodeRabbit 리뷰 — users.md #70 응답 예시 지적, #70만 수정하고 나머지는 보류 |

**기록 방법** (한 줄씩 추가):

```
| 높음 | docs/modules/bands.md | createBand의 초대 실패 목록 분리 로직이 더 명확하게 설명되어야 함 | bands 모듈에 새 초대 관련 기능 추가 중 |
| 중간 | docs/testing.md | Repository 테스트에서 $transaction mock 패턴 예시 부족 | notifications.prisma-repository.spec.ts 작성 중 |
| 낮음 | CLAUDE.md | soft-delete 조회 시 deletedAt null 조건 규칙이 필수 규칙 목록에 없음 | spaces 모듈 조회 작업 중 |
```

우선순위: **높음** (다음 작업 전에 반영) / **중간** (이번 주) / **낮음** (여유 있을 때)

---

## 적용 완료

> Backlog에서 실제 하네스 파일에 반영된 항목.

| 반영일 | 반영된 파일 | 내용 요약 |
|--------|------------|---------|
| 2026-05-26 | AGENTS.md, CLAUDE.md | 상황별 docs 참고 문서 가이드 추가 |
| 2026-05-26 | AGENTS.md, CLAUDE.md, docs/backend/api-docs/README.md | 모듈 문서와 API 명세서 위치 참고 규칙 추가 |
| 2026-05-26 | AGENTS.md, CLAUDE.md | 새 도메인 모듈 추가 시 modules 설계 문서 작성 규칙 추가 |
| 2026-06-01 | .claude/agents/be-orchestrator.md | be-orchestrate skill과 Phase 구조 동기화 (0~5단계), 설계 문서 자동 보관 단계(Phase 5) 추가 |
| 2026-06-01 | .claude/agents/be-qa.md | be-qa skill 대비 누락된 체크리스트 항목 동기화 (DTO/타입, Soft Delete, Prisma, 네이밍, Swagger) |
| 2026-06-01 | docs/backend/conventions.md | Section 10 Swagger 데코레이터 규칙 신규 추가 |
| 2026-06-01 | .claude/agents/be-designer.md, .claude/skills/be-design/SKILL.md | API 번호(#N) 명시 및 신규 API 넘버 부여 규칙 추가, @ApiProperty 설계 포함 |
| 2026-06-01 | .claude/agents/be-api-sync.md, .claude/skills/be-api-sync/SKILL.md | Notion #N 넘버링 보존, 출처 URL 노출 제거 |
| 2026-06-01 | .claude/commands/pr.md | 작업 내용에 API #N 번호 표기 규칙 추가 |
