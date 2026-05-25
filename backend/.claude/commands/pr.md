# /pr — Draft PR 생성

## 1. 사전 확인

```bash
git branch --show-current
git status
git log dev..HEAD --oneline
```

- `main` 또는 `dev` 브랜치이면 중단
- 미커밋 변경사항이 있으면 `/commit` 먼저 실행

## 2. 정보 수집

**Jira ID** — 브랜치명에서 자동 추출 (`[A-Z]+-[0-9]+` 패턴)
예: `feat/KAN-42-band-invite` → `KAN-42`
패턴이 없으면 사용자에게 확인한다.

**라벨** — 브랜치 prefix로 자동 결정:

| 브랜치 prefix | 라벨 |
|--------------|------|
| feat/ | feat |
| fix/ | bug |
| chore/ | chore |
| docs/ | docs |
| refactor/ | refactor |
| hotfix/ | hotfix |
| test/ | test |
| story/ | story |

Backend 작업이면 `BE`도 추가, Frontend 작업이면 `FE` 추가.

## 3. PR 본문 작성

`../.github/pull_request_template.md`를 읽어 각 섹션을 채운다.

```bash
# 템플릿 읽기
cat ../.github/pull_request_template.md
```

**섹션 작성 기준:**

- **소요 시간**: `git log dev..HEAD`와 변경 파일 규모를 보고 리뷰 시간 추산
- **작업 요약**: 한 줄로 이 PR의 핵심 변경을 설명
- **작업 내용**: `git log dev..HEAD --oneline` 커밋 목록 기반으로 번호 목록
- **주요 고민 및 해결 과정**: 비자명한 구현 결정이 있으면 기술, 없으면 "없음"
- **참고 문서**: 관련 외부 문서 링크 (없으면 생략)
- **리뷰 요구사항**: 리뷰어가 집중해야 할 부분 (없으면 생략)

## 4. 사용자 확인

push와 PR 생성 전에 아래 내용을 출력하고 **반드시 사용자 확인을 받는다**:

```
PR 제목: [{JIRA_ID}] {제목}
라벨: {라벨 목록}
대상 브랜치: dev
본문 미리보기:
{본문}
```

## 5. Push & PR 생성

사용자 승인 후 실행:

```bash
# 브랜치 push
git push -u origin HEAD

# Draft PR 생성
gh pr create \
  --draft \
  --base dev \
  --title "[{JIRA_ID}] {제목}" \
  --label "{라벨1}" \
  --label "{라벨2}" \
  --body "$(cat <<'EOF'
{채워진 본문}
EOF
)"
```

## 6. 완료 출력

PR URL과 제목을 출력한다.
