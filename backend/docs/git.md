# Git 가이드 — 커밋 & PR

## 커밋

### 타입 목록

| 이모지 | 타입 | 사용 시점 |
|--------|------|----------|
| ✨ | feat | 새로운 기능 추가 |
| 🐛 | fix | 버그 수정 |
| ♻️ | refactor | 코드 리팩토링 |
| 📝 | docs | 문서 추가/수정 |
| ⚡ | perf | 성능 개선 |
| 🔧 | chore | 설정 파일 수정 |
| 🚀 | deploy | 배포 관련 |
| 🔥 | remove | 코드/파일 삭제 |
| 💄 | style | UI/CSS 파일 추가/수정 |
| 🧪 | test | 테스트 코드 추가/수정 |

### 메시지 형식

```
{이모지} {type}: {한국어 제목}
```

예시:
```
✨ feat: 밴드 초대 수락/거절 API 추가
🐛 fix: 탈퇴한 멤버 조회 시 soft-delete 조건 누락 수정
🧪 test: SpacesService 트랜잭션 일관성 테스트 추가
♻️ refactor: BandsRepository 인터페이스 메서드 분리
```

### 규칙

- 제목은 한국어, 100자 이내
- 동사로 시작: "추가", "수정", "삭제", "개선"
- 구현 세부사항(파일명, 함수명 나열)은 제목에 쓰지 않는다
- `pnpm run commit` (Commitizen)은 인터랙티브 전용 — 터미널에서 직접 실행할 때 사용
- Agent는 `git commit -m` 으로 직접 실행한다 (scope 없음)

### 커밋 금지 항목

- `.env*`, `*.pem`, 비밀 키 파일
- `src/generated/` (Prisma 생성 파일)
- `node_modules/`

---

## 브랜치 네이밍

```
{prefix}/{JIRA_ID}-{간단한-설명-kebab-case}
```

예시: `feat/KAN-42-band-invite-api`

| prefix | 의미 | PR 라벨 자동 매핑 |
|--------|------|:---------------:|
| feat/ | 기능 추가 | feat |
| fix/ | 버그 수정 | bug |
| chore/ | 설정/기타 | chore |
| docs/ | 문서 | docs |
| refactor/ | 리팩토링 | refactor |
| hotfix/ | 긴급 수정 | hotfix |
| test/ | 테스트 | test |
| story/ | UI/스토리 | story |

---

## PR 생성

### 절차

1. `main`, `dev` 브랜치에서는 PR 생성 불가
2. 브랜치명에서 Jira ID 추출: `feat/KAN-42-...` → `KAN-42`
3. 브랜치 prefix로 라벨 자동 결정 + Backend 작업이면 `BE` 추가
4. PR 제목: `[{JIRA_ID}] {제목}` (Jira ID 없으면 `{제목}` 만)
5. PR 본문: 아래 템플릿 채우기
6. `git push -u origin HEAD`
7. `gh pr create --draft --base dev ...`

**push와 PR 생성은 사용자 확인 후 실행한다.**

### PR 본문 템플릿

```markdown
## ⏱ 소요 시간
- 리뷰 예상 시간: {X}분

## 📌 작업 요약
{한 줄 요약}

## 📝 작업 내용
1. {작업 항목}
2. {작업 항목}
3. {작업 항목}

## 🚨 주요 고민 및 해결 과정
### 문제
{주요 고민이나 문제 — 없으면 "없음"}

### 해결 과정
{해결 과정 — 없으면 생략}

## 📑 참고 문서/ ADR

## 💬 리뷰 요구사항
{리뷰어가 특별히 봐주어야 할 부분 — 없으면 생략}
```

### gh CLI 명령어 레퍼런스

```bash
# Draft PR 생성
gh pr create \
  --draft \
  --base dev \
  --title "[KAN-42] 밴드 초대 API 추가" \
  --label "feat" \
  --label "BE" \
  --body "..."

# PR 목록 확인
gh pr list

# 현재 브랜치 PR 보기
gh pr view

# PR ready 전환 (Draft 해제)
gh pr ready
```

### 라벨 목록

`feat` `bug` `chore` `docs` `refactor` `hotfix` `test` `story` `FE` `BE` `infra`
