# /commit — 커밋 생성

프로젝트는 Commitizen (`pnpm run commit`, `jamplay/` 기준)으로 커밋 메시지를 관리한다.
Agent는 인터랙티브 Commitizen 대신 **동일한 포맷**으로 `git commit -m`을 직접 실행한다.

## 1. 변경 사항 파악

```bash
git status
git diff HEAD
```

## 2. 커밋 타입 결정

| 이모지 타입 | 사용 시점 |
|------------|----------|
| `✨ feat` | 새 기능, 새 API, 새 서비스 메서드 |
| `🐛 fix` | 버그, 잘못된 동작 수정 |
| `♻️ refactor` | 동작 변화 없는 구조 개선 |
| `📝 docs` | 문서, 주석, CLAUDE.md, harness 파일 |
| `⚡ perf` | 성능 최적화 |
| `🔧 chore` | 설정, 패키지, 빌드 파일 |
| `🚀 deploy` | 배포 설정 |
| `🔥 remove` | 코드/파일 삭제 |
| `💄 style` | UI, CSS, Tailwind |
| `🧪 test` | .spec.ts 파일만 변경 |

기능 코드 + 테스트 동시 변경 → `✨ feat` 또는 `🐛 fix` 사용 (🧪 test 아님)

## 3. 메시지 작성 규칙

Commitizen 출력 포맷과 동일하게 작성한다:

```
{이모지} {type}: {한국어 제목}
```

- 한국어, 100자 이내 (`.cz-config.js`의 `subjectLimit: 100`)
- 동사로 시작: "추가", "수정", "삭제", "개선", "분리"
- scope 없음 (`.cz-config.js`에서 skip 처리됨)
- 구현 세부사항(파일명·함수명 나열) 금지 — PR 본문에 기재

예시:
```
✨ feat: 밴드 초대 수락/거절 API 추가
🐛 fix: 탈퇴한 멤버 조회 시 soft-delete 조건 누락 수정
🧪 test: SpacesService 트랜잭션 일관성 테스트 추가
```

## 4. 스테이징 및 커밋

```bash
# 관련 파일만 명시적으로 스테이징 (git add -A / git add . 사용 금지)
git add {파일1} {파일2} ...

# 커밋 (Commitizen 포맷 동일 적용)
git commit -m "{이모지} {type}: {한국어 제목}"
```

**스테이징 금지 파일**
- `.env*`, `*.pem`, 비밀 키 파일
- `src/generated/` (prisma generate 결과물)
- `node_modules/`

## 5. 커밋 후 확인

```bash
git log --oneline -3
```

최근 3개 커밋을 출력하고 메시지 포맷이 올바른지 확인한다.
