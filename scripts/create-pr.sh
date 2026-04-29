#!/usr/bin/env bash
set -e

# ─── 색상 출력 헬퍼 ───────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}ℹ ${RESET}$1"; }
success() { echo -e "${GREEN}✔ ${RESET}$1"; }
warn()    { echo -e "${YELLOW}⚠ ${RESET}$1"; }
error()   { echo -e "${RED}✖ ${RESET}$1" >&2; exit 1; }

# ─── gh CLI 확인 ─────────────────────────────────────────────────────────────
if ! command -v gh &>/dev/null; then
  error "gh CLI가 설치되어 있지 않습니다. https://cli.github.com 에서 설치해주세요."
fi

# ─── 현재 브랜치 확인 ────────────────────────────────────────────────────────
BRANCH=$(git branch --show-current)
[ -z "$BRANCH" ] && error "브랜치 위에 있지 않습니다."
[[ "$BRANCH" == "main" || "$BRANCH" == "dev" ]] && \
  error "'$BRANCH' 브랜치에서는 PR을 생성할 수 없습니다."

info "현재 브랜치: ${BOLD}$BRANCH${RESET}"

# ─── Jira ID 추출 (브랜치명에서 KAN-32 패턴 탐색) ─────────────────────────────
JIRA_ID=$(echo "$BRANCH" | grep -oE '[A-Z]+-[0-9]+' | head -1)

if [ -n "$JIRA_ID" ]; then
  info "브랜치에서 Jira ID 감지: ${BOLD}$JIRA_ID${RESET}"
else
  echo -e "${YELLOW}브랜치명에서 Jira ID를 찾지 못했습니다.${RESET}"
  read -rp "$(echo -e "${BOLD}Jira task ID${RESET} (예: KAN-32  |  hotfix·긴급 등 없으면 Enter 건너뜀): ")" JIRA_ID
  if [ -n "$JIRA_ID" ] && ! echo "$JIRA_ID" | grep -qE '^[A-Z]+-[0-9]+$'; then
    error "Jira ID 형식이 올바르지 않습니다. 예: KAN-32"
  fi
fi

# ─── PR 제목 입력 ─────────────────────────────────────────────────────────────
echo ""
read -rp "$(echo -e "${BOLD}PR 제목${RESET}: ")" PR_TITLE_INPUT
[ -z "$PR_TITLE_INPUT" ] && error "PR 제목은 필수입니다."

if [ -n "$JIRA_ID" ]; then
  FULL_TITLE="[$JIRA_ID] $PR_TITLE_INPUT"
else
  warn "Jira ID 없이 PR을 생성합니다."
  FULL_TITLE="$PR_TITLE_INPUT"
fi

success "최종 제목: ${BOLD}$FULL_TITLE${RESET}"

# ─── 타입 라벨: 브랜치 prefix → 자동 결정 ────────────────────────────────────
# 지원 라벨: feat / bug / chore / docs / refactor / hotfix / test / story
TYPE_LABEL=""
case "$BRANCH" in
  feat/*)     TYPE_LABEL="feat" ;;
  fix/*)      TYPE_LABEL="bug" ;;
  chore/*)    TYPE_LABEL="chore" ;;
  docs/*)     TYPE_LABEL="docs" ;;
  refactor/*) TYPE_LABEL="refactor" ;;
  hotfix/*)   TYPE_LABEL="hotfix" ;;
  test/*)     TYPE_LABEL="test" ;;
  story/*)    TYPE_LABEL="story" ;;
esac

[ -n "$TYPE_LABEL" ] && info "타입 라벨 자동 감지: ${BOLD}$TYPE_LABEL${RESET}"

# ─── 영역 라벨: 사용자 선택 (BE / FE / infra) ────────────────────────────────
echo ""
echo -e "${BOLD}영역 라벨 선택${RESET} (Enter = 건너뜀)"
echo "  1) FE"
echo "  2) BE"
echo "  3) infra"
read -rp "번호 입력: " AREA_NUM

AREA_LABEL=""
case "$AREA_NUM" in
  1) AREA_LABEL="FE" ;;
  2) AREA_LABEL="BE" ;;
  3) AREA_LABEL="infra" ;;
  *) ;;
esac

[ -n "$AREA_LABEL" ] && info "영역 라벨: ${BOLD}$AREA_LABEL${RESET}"

# ─── 브랜치 push ─────────────────────────────────────────────────────────────
echo ""
info "브랜치를 origin에 push 중..."
git push -u origin HEAD
success "Push 완료"

# ─── PR 본문: 템플릿 읽기 ────────────────────────────────────────────────────
REPO_ROOT=$(git rev-parse --show-top-level 2>/dev/null || git rev-parse --show-toplevel)
TEMPLATE_PATH="$REPO_ROOT/.github/pull_request_template.md"
PR_BODY=""
[ -f "$TEMPLATE_PATH" ] && PR_BODY=$(cat "$TEMPLATE_PATH")

# ─── 라벨 유효성 확인 후 PR 생성 ─────────────────────────────────────────────
echo ""
info "Draft PR 생성 중..."

REPO_NAME=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
EXISTING_LABELS=""
[ -n "$REPO_NAME" ] && EXISTING_LABELS=$(gh label list --repo "$REPO_NAME" --json name -q '.[].name' 2>/dev/null || true)

apply_label_if_exists() {
  local label="$1"
  if echo "$EXISTING_LABELS" | grep -qx "$label"; then
    echo "$label"
  else
    warn "라벨 '${label}'이 저장소에 없어 건너뜁니다."
    echo ""
  fi
}

CREATE_CMD=(gh pr create --draft --title "$FULL_TITLE" --body "$PR_BODY")

if [ -n "$TYPE_LABEL" ]; then
  VALID=$(apply_label_if_exists "$TYPE_LABEL")
  [ -n "$VALID" ] && CREATE_CMD+=(--label "$VALID")
fi

if [ -n "$AREA_LABEL" ]; then
  VALID=$(apply_label_if_exists "$AREA_LABEL")
  [ -n "$VALID" ] && CREATE_CMD+=(--label "$VALID")
fi

PR_URL=$("${CREATE_CMD[@]}")

echo ""
success "Draft PR이 생성되었습니다!"
echo -e "  ${CYAN}${PR_URL}${RESET}"
echo ""
info "리뷰어 자동 지정 및 self-assign은 GitHub Actions가 처리합니다."
