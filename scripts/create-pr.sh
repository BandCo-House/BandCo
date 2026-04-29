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

# ─── 라벨 선택 ────────────────────────────────────────────────────────────────
ALL_LABELS=("feat" "bug" "chore" "docs" "refactor" "hotfix" "test" "story" "FE" "BE" "infra")

# 브랜치 prefix로 기본 선택 인덱스 추론
DEFAULT_IDX=""
case "$BRANCH" in
  feat/*)     DEFAULT_IDX=1 ;;
  fix/*)      DEFAULT_IDX=2 ;;
  chore/*)    DEFAULT_IDX=3 ;;
  docs/*)     DEFAULT_IDX=4 ;;
  refactor/*) DEFAULT_IDX=5 ;;
  hotfix/*)   DEFAULT_IDX=6 ;;
  test/*)     DEFAULT_IDX=7 ;;
  story/*)    DEFAULT_IDX=8 ;;
esac

echo ""
echo -e "${BOLD}라벨 선택${RESET} — 번호를 띄어쓰기로 구분해 입력하세요 (Enter = 건너뜀)"
echo ""
for i in "${!ALL_LABELS[@]}"; do
  NUM=$((i + 1))
  LABEL="${ALL_LABELS[$i]}"
  if [ "$NUM" = "$DEFAULT_IDX" ]; then
    printf "  ${GREEN}%2d) %-12s${RESET}" "$NUM" "$LABEL  ←"
  else
    printf "  %2d) %-12s" "$NUM" "$LABEL"
  fi
  # 4열로 줄바꿈
  [ $(( NUM % 4 )) -eq 0 ] && echo ""
done
echo ""
echo ""

DEFAULT_HINT=""
[ -n "$DEFAULT_IDX" ] && DEFAULT_HINT=" (기본값: ${DEFAULT_IDX})"
read -rp "$(echo -e "${BOLD}번호 입력${RESET}${DEFAULT_HINT}: ")" LABEL_INPUT

# 입력 없으면 기본값 사용
[ -z "$LABEL_INPUT" ] && [ -n "$DEFAULT_IDX" ] && LABEL_INPUT="$DEFAULT_IDX"

SELECTED_LABELS=()
for num in $LABEL_INPUT; do
  if [[ "$num" =~ ^[0-9]+$ ]] && [ "$num" -ge 1 ] && [ "$num" -le "${#ALL_LABELS[@]}" ]; then
    SELECTED_LABELS+=("${ALL_LABELS[$((num - 1))]}")
  else
    warn "유효하지 않은 번호 '$num' — 건너뜁니다."
  fi
done

if [ "${#SELECTED_LABELS[@]}" -gt 0 ]; then
  info "선택된 라벨: ${BOLD}${SELECTED_LABELS[*]}${RESET}"
fi

# ─── 브랜치 push ─────────────────────────────────────────────────────────────
echo ""
info "브랜치를 origin에 push 중..."
git push -u origin HEAD
success "Push 완료"

# ─── PR 본문: 템플릿을 임시 파일로 준비 ──────────────────────────────────────
REPO_ROOT=$(git rev-parse --show-toplevel)
TEMPLATE_PATH="$REPO_ROOT/.github/pull_request_template.md"
BODY_FILE=$(mktemp)
trap 'rm -f "$BODY_FILE"' EXIT

[ -f "$TEMPLATE_PATH" ] && cat "$TEMPLATE_PATH" > "$BODY_FILE"

# ─── 라벨 유효성 확인 ────────────────────────────────────────────────────────
echo ""
info "Draft PR 생성 중..."

REPO_NAME=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
EXISTING_LABELS=""
if [ -n "$REPO_NAME" ]; then
  EXISTING_LABELS=$(gh label list --repo "$REPO_NAME" --json name -q '.[].name' 2>/dev/null || true)
fi

LABEL_ARGS=()
for label in "${SELECTED_LABELS[@]}"; do
  if echo "$EXISTING_LABELS" | grep -qx "$label"; then
    LABEL_ARGS+=(--label "$label")
  else
    warn "라벨 '${label}'이 저장소에 없어 건너뜁니다." >&2
  fi
done

# ─── Draft PR 생성 ───────────────────────────────────────────────────────────
PR_URL=$(gh pr create \
  --draft \
  --title "$FULL_TITLE" \
  --body-file "$BODY_FILE" \
  "${LABEL_ARGS[@]}")

echo ""
success "Draft PR이 생성되었습니다!"
echo -e "  ${CYAN}${PR_URL}${RESET}"
echo ""
info "리뷰어 자동 지정 및 self-assign은 GitHub Actions가 처리합니다."
