# JamPlay Git Root Codex 설정

이 디렉터리는 실제 Git 루트인 `jamplay/`에서 Codex를 시작할 때 적용되는 프로젝트 레이어다.

역할:

- `config.toml`: workspace-write, on-request, hooks 활성화
- `hooks.json`: `backend/scripts/hooks/codex-*.js` 연결
- `rules/default.rules`: pnpm 강제, production migration deploy와 파괴적 git 명령 차단

백엔드 디렉터리에서 Codex를 시작하면 `backend/.codex/` 레이어가 추가로 적용된다.
