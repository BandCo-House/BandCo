# Codex 설정

Codex는 백엔드 작업의 프로젝트 규칙 파일로 `AGENTS.md`를 사용한다. Claude의 `CLAUDE.md`, `.claude/agents`, `.claude/skills`는 Codex에서 직접 실행되지 않으므로 워크플로우 참고 자료로만 사용한다.

상위 작업 폴더(`/Users/jun/Desktop/jam`)에서 시작할 때는 상위 `.codex/`가 적용된다:

```bash
codex -C ../..
```

실제 Git 루트(`jamplay/`)에서 시작할 때는 `../.codex/`가 적용된다:

```bash
codex -C ..
```

백엔드 디렉터리에서 직접 시작할 때는 Git 루트와 이 디렉터리의 `.codex/` 레이어가 함께 적용된다:

```bash
codex -C .
```

로컬 프로필 템플릿 위치:

```text
.codex/jamplay-backend.config.toml
```

프로젝트 훅 정의 위치:

```text
.codex/hooks.json
```

백엔드 직접 실행용 프로젝트 설정:

```text
.codex/config.toml
```

Codex CLI 프로필 파일은 `$CODEX_HOME`에서 읽힌다. 따라서 이 저장소의 프로필 파일은 체크인된 템플릿이다. 실제 프로필로 사용하려면 아래 위치로 복사한다:

```text
$CODEX_HOME/jamplay-backend.config.toml
```

그다음 아래처럼 실행한다:

```bash
codex -C . --profile jamplay-backend
```

실제 행동 규칙의 기준은 항상 `AGENTS.md`다. `project_doc_fallback_filenames = ["CLAUDE.md"]`는 AGENTS가 없는 하위 실험 디렉터리를 위한 호환 장치일 뿐이다.

훅을 변경한 뒤에는 Codex 세션을 다시 시작한다. 이미 실행 중인 세션은 이전 훅 설정을 계속 사용할 수 있다.

명령 정책 요약:

- 패키지 매니저는 `pnpm`만 사용한다.
- macOS/Linux에서는 `sh ./scripts/verify.sh`를 실행한다.
- Windows에서는 먼저 Git Bash로 `./scripts/verify.sh`를 실행한다.
- Git Bash 검증이 실패하거나 사용할 수 없으면 `pnpm.cmd run lint`, `pnpm.cmd run format:check`, `pnpm.cmd run build`, `pnpm.cmd run test` 순서로 같은 검증을 수행한다.
- `pnpm run prisma:migrate:deploy`, `git reset --hard`, `git clean -f`, force push는 실행하지 않는다.

훅 정책 요약:

- `SessionStart`: 백엔드 문서 읽기 기준을 Codex context에 주입한다.
- `UserPromptSubmit`: 백엔드 구현·검증 요청이면 필요한 문서 경로를 추가 context로 알려준다.
- `PreToolUse`: 위험 명령을 차단하고, 백엔드 구현 파일 수정 전 `_workspace/design.md` 존재를 요구한다.
- `PostToolUse`: Service/Controller/Prisma 변경 후 테스트·API 문서·Prisma 후속 작업을 추가 context로 알려준다.
- `Stop`: 백엔드 변경이 있을 때 `sh ./scripts/verify.sh`를 실행하고 실패하면 완료를 막는다.
