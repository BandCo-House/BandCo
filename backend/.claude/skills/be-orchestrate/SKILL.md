---
name: be-orchestrate
description: JamPlay 백엔드 작업을 Notion API 동기화→설계→구현→QA 4단계로 오케스트레이션하는 스킬. "API 추가해줘", "모듈 구현해줘", "기능 개발해줘", "백엔드 작업해줘", "Service 메서드 추가", "Repository 수정", "다시 해줘", "수정해줘", "재실행", "이전 결과 기반으로 보완해줘", "[모듈]만 다시" 등 백엔드 기능 구현 및 후속 작업 요청 시 반드시 이 스킬을 사용한다. 단순 질문·코드 설명·하네스 설정 변경은 트리거하지 않는다.
---

# Be-Orchestrate — 백엔드 오케스트레이션 스킬

백엔드 작업을 Notion API 동기화 → 설계 → 구현 → QA 4단계로 수행한다.
`be-api-sync`, `be-designer`, `be-qa` 서브 에이전트를 조율하며 하네스 규칙 준수를 보장한다.

## Phase 0: 컨텍스트 확인

`_workspace/` 디렉토리 존재 여부로 실행 모드를 결정한다:

| 상황 | 처리 |
|------|------|
| `_workspace/` 미존재 | 초기 실행 → Phase 1부터 |
| `_workspace/` 존재 + 부분 수정 요청 | 부분 재실행 → 해당 Phase만 |
| `_workspace/` 존재 + 새 작업 요청 | 새 실행 → `_workspace/`를 `_workspace_prev/`로 이동 후 Phase 1 |

## Phase 1: API 문서 동기화 (be-api-sync 서브 에이전트)

`docs/backend/api-docs/{module}.md`가 없거나 사용자가 갱신을 원하면 `be-api-sync` 서브 에이전트를 실행한다. 실행 전 `.claude/agents/be-api-sync.md`를 읽는다.

```
Agent({
  subagent_type: "be-api-sync",
  model: "sonnet",
  description: "Notion API 명세 동기화",
  prompt: `
    {모듈명} 모듈의 API 명세를 Notion에서 가져와 docs/backend/api-docs/{모듈명}.md에 저장하라.
    .claude/agents/be-api-sync.md의 동기화 프로세스를 따르라.
  `
})
```

이미 `docs/backend/api-docs/{module}.md`가 존재하고 사용자가 갱신을 요청하지 않았으면 이 Phase를 건너뛴다.

**Gap 리포트 처리:**
be-api-sync가 보완 필요 항목을 보고하면 사용자에게 제시하고 진행 방식을 확인한다:
- "사용자 확인 필요" 항목이 있으면 → 사용자가 Notion을 업데이트하거나 직접 내용을 제공할 때까지 대기
- "자동 보완 가능" 항목만 있으면 → 설계 단계에서 자동 보완 진행을 알리고 Phase 2로 이동

## Phase 2: 설계 (be-designer 서브 에이전트)

`be-designer` 서브 에이전트를 실행한다. 실행 전 `.claude/agents/be-designer.md`를 읽는다.

```
Agent({
  subagent_type: "be-designer",
  model: "sonnet",
  description: "백엔드 모듈 설계",
  prompt: `
    다음 작업을 설계하라: {사용자 요청 내용}

    반드시:
    1. docs/backend/api-docs/{모듈명}.md를 읽고 API 명세를 검증하라
    2. CLAUDE.md의 모듈 문서 테이블에서 관련 모듈 doc을 찾아 읽어라
    3. prisma/schema.prisma에서 관련 모델을 확인하라
    4. .claude/agents/be-designer.md의 설계 문서 구조를 따라 _workspace/design.md를 작성하라
  `
})
```

설계 완료 후 `_workspace/design.md`를 사용자에게 제시하고 승인을 받는다.
API 명세와 사용자 요청이 충돌하면 설계자가 불일치 내용을 명시한 것을 확인하고 사용자에게 처리 방향을 확인받는다.
**승인 없이 구현을 시작하지 않는다.**

## Phase 3: 구현

사용자 승인 후 `_workspace/design.md`의 작업 범위와 설계를 기반으로 구현한다.

구현 중 확인:
- 설계의 Repository 인터페이스와 Service 비즈니스 규칙을 그대로 따른다
- 스키마 변경이 있으면 `pnpm run prisma:generate`를 실행한다
- 설계와 다르게 구현해야 할 이유가 생기면 사용자에게 먼저 보고한다

## Phase 4: QA (be-qa 서브 에이전트)

구현 완료 후 `be-qa` 서브 에이전트를 실행한다. 실행 전 `.claude/agents/be-qa.md`를 읽는다.

```
Agent({
  subagent_type: "be-qa",
  model: "sonnet",
  description: "백엔드 QA 검증",
  prompt: `
    구현된 코드를 검증하라.

    반드시:
    1. git diff --name-only HEAD로 변경 파일을 확인하라
    2. _workspace/design.md의 설계와 실제 구현의 일치 여부를 확인하라
    3. .claude/agents/be-qa.md의 하네스 체크리스트를 실행하라
    4. sh ./scripts/verify.sh를 실행하라
    5. QA 리포트 형식으로 결과를 보고하라
  `
})
```

QA 실패 항목이 있으면 수정 후 QA를 재실행한다. **verify.sh를 통과해야만 작업을 완료로 선언한다.**

## 에러 핸들링

| 상황 | 처리 |
|------|------|
| API 동기화 실패 (Notion 페이지 없음) | 사용자에게 URL/ID 요청. 없으면 설계자가 사용자 요청만으로 설계 |
| 설계자 에러 | 사용자에게 보고 후 재설계 여부 확인 |
| API 명세-요청 불일치 | 설계자가 불일치 명시 → 사용자에게 처리 방향 확인 |
| QA 실패 | 실패 항목 수정 → QA 재실행 |
| verify.sh 실패 | 에러 내용 분석 → 수정 → 재실행. 2회 연속 실패 시 사용자에게 보고 |

## 테스트 시나리오

**정상 흐름:** `users 모듈에 닉네임 수정 API 추가해줘` → Notion 명세 동기화 → 설계 생성 → 승인 → 구현 → QA 통과 → 완료

**API 명세 없음:** `spaces 모듈 구현해줘` + Notion 검색 실패 → 사용자에게 URL 요청 → URL 입력 → 동기화 → 설계 → 구현 → QA

**재실행:** `설계 수정해줘` → `_workspace/design.md` 존재 확인 → 설계자 재실행 → 수정된 설계 제시
