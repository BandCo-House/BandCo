# Codex 설정

Codex는 이 백엔드 작업의 프로젝트 규칙 파일로 `AGENTS.md`를 사용한다.

JamPlay 백엔드 작업은 아래 실행 형태를 기준으로 한다:

```bash
codex -C . --sandbox workspace-write --ask-for-approval on-request
```

로컬 프로필 템플릿 위치:

```text
.codex/jamplay-backend.config.toml
```

프로젝트 훅 정의 위치:

```text
.codex/hooks.json
```

Codex CLI의 `profile-v2` 파일은 `$CODEX_HOME`에서 읽힌다. 따라서 이 저장소의 프로필 파일은
체크인된 템플릿이다. 실제 프로필로 사용하려면 아래 위치로 복사한다:

```text
$CODEX_HOME/jamplay-backend.config.toml
```

그다음 아래처럼 실행한다:

```bash
codex -C . --profile-v2 jamplay-backend
```

실제 행동 규칙의 기준은 항상 `AGENTS.md`다.

훅을 변경한 뒤에는 Codex 세션을 다시 시작한다. 이미 실행 중인 세션은 이전 훅 설정을 계속 사용할 수 있다.

명령 정책 요약:

- 패키지 매니저는 `pnpm`만 사용한다.
- Windows에서는 Git Bash의 `sh`로 `./scripts/verify.sh`를 실행한다.
- Git Bash 검증이 실패하거나 사용할 수 없으면 `pnpm.cmd run lint`, `pnpm.cmd run format:check`,
  `pnpm.cmd run build`, `pnpm.cmd run test` 순서로 같은 검증을 수행한다.
- `pnpm run prisma:migrate:deploy`, `git reset --hard`, `git clean -f`, force push는 실행하지 않는다.
