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
| — | — | — | — |

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
