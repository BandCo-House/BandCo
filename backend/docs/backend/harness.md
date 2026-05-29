# Backend Harness 설계 기록

백엔드 에이전트 팀 하네스의 설계 배경, 아키텍처 결정, 운영 방법을 기록한다.

---

## 구축 배경

기존 방식의 문제:
- 설계 단계가 없어 구현이 바로 시작되고, 하네스 규칙 위반이 구현 완료 후에야 발견됨
- Notion API 명세와 구현 사이의 일치 여부를 수동으로 확인해야 했음
- QA가 사람이 체크리스트를 직접 보는 방식이었음 (`/review-be` 명령어)

목표:
1. Notion API 명세를 구현의 1차 소스로 사용
2. 구현 전 설계 단계 의무화 및 API 명세 검증
3. QA 자동화 (하네스 체크리스트 + verify.sh)

---

## 에이전트 팀 구성

이 섹션의 에이전트·스킬 구조는 Claude 하네스의 원본 설계다. Codex는 `.claude/agents`와 `.claude/skills`를 직접 실행하지 않으므로, Codex에서는 같은 흐름을 `AGENTS.md`, `.codex/hooks.json`, `.codex/rules/default.rules`, `scripts/hooks/codex-*.js`로 재현한다.

### 아키텍처 패턴

**Pipeline + 서브 에이전트 (Sequential)**

팀 모드(SendMessage 기반 실시간 통신) 대신 서브 에이전트 파이프라인을 선택한 이유:
각 단계(API 동기화 → 설계 → 구현 → QA)는 이전 단계 산출물에 의존하므로 병렬 실행이 불가능하다. 에이전트 간 실시간 통신이 없어도 되므로 팀 모드의 오버헤드가 이득보다 크다.

### 에이전트 역할

| 에이전트 | 역할 | 입력 | 출력 |
|---------|------|------|------|
| be-orchestrator | 전체 워크플로우 조율 | 사용자 요청 | 각 단계 위임 + 최종 요약 |
| be-api-sync | Notion API 명세 동기화 | 모듈명 | `docs/backend/api-docs/{module}.md` |
| be-designer | API 검증 + 구현 계획 수립 | api-docs + schema + 모듈 doc | `_workspace/design.md` |
| be-qa | 하네스 규칙 자동 검증 | 구현 코드 + `design.md` | QA 리포트 |

### 데이터 흐름

```
Notion (API 명세)
    ↓  mcp__claude_ai_Notion__notion-fetch
docs/backend/api-docs/{module}.md
    ↓  be-designer 읽기
_workspace/design.md  ←  prisma/schema.prisma
    ↓  메인 Claude 구현         docs/backend/modules/{module}.md
구현 코드
    ↓  be-qa 검증
QA 리포트
```

---

## 스킬 트리거 규칙

| 스킬 | 트리거 | 트리거하지 않음 |
|------|--------|--------------|
| `be-orchestrate` | 기능 구현·추가·수정 요청, 후속 재실행 | 단순 질문, 코드 설명 |
| `be-api-sync` | Notion API 동기화 요청 | 이미 api-docs가 최신인 경우 |
| `be-design` | 설계만 필요한 요청 | 구현 요청 (→ `be-orchestrate`) |
| `be-qa` | 검증·QA·verify 요청 | 구현 요청 (→ `be-orchestrate`) |

### 기존 명령어와의 관계

| 명령어/스킬 | 역할 | 관계 |
|-----------|------|------|
| `/commit` | 커밋 생성 | 독립 (be-qa 이후 사용) |
| `/pr` | PR 생성 | 독립 |
| `/review-be` | 수동 코드 리뷰 | `be-qa`의 수동 대체 |
| `be-qa` | 자동 QA + verify.sh | `/review-be` 보완·자동화 |

---

## 워크플로우

```
사용자 요청 (기능 구현)
    │
    ▼
[be-orchestrate 스킬]
    │
    ├── Phase 0: 컨텍스트 확인
    │           _workspace/ 존재 여부로 초기/재실행 판단
    │
    ├── Phase 1: API 동기화  [be-api-sync 서브 에이전트]
    │           Notion → docs/backend/api-docs/{module}.md
    │
    ├── Phase 2: 설계  [be-designer 서브 에이전트]
    │           ① api-docs 읽기 + 검증
    │           ② schema.prisma + 모듈 doc 읽기
    │           ③ _workspace/design.md 생성
    │                   ↓ 사용자 승인
    │
    ├── Phase 3: 구현  [메인 Claude]
    │           design.md 기반 구현
    │
    └── Phase 4: QA  [be-qa 서브 에이전트]
                하네스 체크리스트 + sh ./scripts/verify.sh
```

---

## Codex 이식 결정

### Codex에서 그대로 옮긴 것

| Claude 하네스 | Codex 적용 |
|--------------|------------|
| `CLAUDE.md` 규칙 | `AGENTS.md`에 반영 |
| Stop 훅 `sh ./scripts/verify.sh` | `codex-stop-verify.js`에서 백엔드 변경 시 실행 |
| 위험 명령 차단 | `rules/default.rules` + `codex-pre-tool-use.js` |
| 구현 후 테스트/API 문서 알림 | `codex-post-tool-use.js`의 `additionalContext` |

### Codex에서 다르게 처리한 것

| 항목 | 처리 |
|------|------|
| `.claude/agents` 서브에이전트 호출 | Codex가 직접 실행하지 않는다. `AGENTS.md`에 수동 워크플로우로 기록한다. |
| `.claude/skills` 자동 트리거 | Codex skill 형식이 아니므로 참고 문서로 남긴다. |
| Claude Notion MCP 도구명 | Codex Notion connector가 있으면 해당 도구를 사용하고, 없으면 사용자에게 URL/내용을 요청한다. |
| `CLAUDE_TOOL_INPUT` | Codex hook stdin JSON으로 대체한다. |

### Codex 문서 탐색 원칙

Codex가 백엔드 구현을 시작할 때 읽는 순서는 아래와 같다.

1. `AGENTS.md`
2. API 작업이면 `docs/backend/api-docs/`
3. 구현 규칙은 `docs/backend/conventions.md`
4. 테스트 작업이면 `docs/backend/testing.md`
5. DB 구조는 `prisma/schema.prisma`
6. 비자명한 작업이면 `_workspace/design.md`

이 순서를 hook이 완전히 강제할 수는 없다. `PreToolUse`는 일부 도구 호출만 가로챌 수 있으므로, 문서 탐색은 `AGENTS.md`와 `UserPromptSubmit` context 주입으로 보강한다.

---

## 아키텍처 결정 기록 (ADR)

### ADR-001: 서브 에이전트 파이프라인 선택
- **결정:** 에이전트 팀(SendMessage) 대신 서브 에이전트 순차 파이프라인
- **이유:** 단계 간 실시간 통신이 불필요하고, 파일 기반 데이터 전달로 충분하다. 팀 모드는 조율 오버헤드만 추가한다.

### ADR-002: be-api-sync를 독립 에이전트로 분리
- **결정:** API 동기화를 별도 에이전트/스킬로 분리
- **이유:** 설계 없이 API 명세만 갱신하는 독립 실행 시나리오가 존재한다. 오케스트레이터 인라인 처리 시 재사용이 불가능하다.

### ADR-003: API 명세를 설계의 1차 소스로 사용
- **결정:** 설계는 사용자 요청이 아닌 Notion API 명세 기준으로 작성
- **이유:** Notion 명세가 팀의 합의된 계약(contract)이다. 사용자 요청과 명세가 다를 경우 불일치를 명시하고 확인받는다.

### ADR-004: QA 에이전트에 general-purpose 타입 사용
- **결정:** `Explore` 타입 아닌 `general-purpose` 사용
- **이유:** `Explore`는 읽기 전용이므로 `sh ./scripts/verify.sh` 실행 불가. QA는 스크립트 실행 권한이 필요하다.

### ADR-005: Codex는 실행 위치별 `.codex/` 레이어를 둔다
- **결정:** 상위 작업 폴더 `.codex/`, 실제 Git 루트 `jamplay/.codex/`, 백엔드 직접 실행용 `jamplay/backend/.codex/`를 둔다.
- **이유:** Codex 공식 설정은 Git 루트에서 현재 작업 디렉터리까지 `.codex/config.toml`을 계층적으로 읽는다. 현재 로컬 구조는 상위 작업 폴더와 실제 Git 루트가 다르므로, 어느 위치에서 시작해도 hook과 rules가 적용되게 한다.

### ADR-006: Codex hook은 코드 영향 변경이 아니어도 백엔드 변경이면 최종 검증을 유지한다
- **결정:** 위험 명령과 백엔드 구현 전 설계 문서를 차단하고, Stop 훅은 백엔드 변경이 있으면 `sh ./scripts/verify.sh`를 실행한다.
- **이유:** 기존 테스트 실패가 있더라도 하네스는 검증 실패를 숨기지 않는다. 문서 확인·테스트 동기화처럼 hook이 완전히 강제하기 어려운 항목은 추가 context로 안내한다.

---

## 확장 가이드

### 새 에이전트 추가 시
1. `.claude/agents/{name}.md` 에이전트 정의 파일 생성
2. `.claude/skills/{name}/SKILL.md` 스킬 파일 생성
3. `be-orchestrate/SKILL.md`에 새 Phase 추가
4. `CLAUDE.md` 변경 이력 갱신
5. 이 파일의 "에이전트 역할" 테이블 갱신

### 기존 규칙 변경 시
- `conventions.md` 규칙 변경 → `be-design/SKILL.md`, `be-qa/SKILL.md` 반영
- `testing.md` 패턴 변경 → `be-design/SKILL.md`의 테스트 계획 섹션, `be-qa/SKILL.md` 반영

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 | 이유 |
|------|------|----------|------|
| 2026-05-28 | v1.0 | be-orchestrator, be-designer, be-qa + 스킬 3개 구성 | 초기 구축 |
| 2026-05-28 | v1.1 | be-api-sync 추가, Notion MCP 통합, docs/backend 규칙 반영 | Notion API 명세 기반 워크플로우로 고도화 |
| 2026-05-29 | v1.2 | Codex 루트 `.codex/` 레이어, rules, stdin 기반 hooks, AGENTS 문서 탐색 규칙 추가 | Claude 하네스를 Codex 동작 모델에 맞게 이식 |
