# /schema — Prisma 스키마 변경 워크플로우

`prisma/schema.prisma`를 수정한 후 실행한다.

## 1. 유효성 검사

```bash
pnpm run prisma:validate
```

실패 시 에러 내용을 보고하고 중단한다. 통과하면 계속 진행한다.

## 2. 포맷

```bash
pnpm run prisma:format
```

## 3. 클라이언트 재생성

```bash
pnpm run prisma:generate
```

## 4. 마이그레이션 여부 확인

사용자에게 묻는다:

```
마이그레이션이 필요한가요? (DB 스키마 변경이 있으면 필요합니다)
```

**필요한 경우** — 마이그레이션 이름을 확인 후 실행:

```bash
pnpm run prisma:migrate:dev -- --name {마이그레이션_이름}
```

마이그레이션 이름 규칙: `snake_case`, 변경 내용을 짧게 표현
예: `add_deleted_at_to_space`, `create_skill_table`

**필요 없는 경우** — 완료.

## 5. 완료 출력

실행한 명령어 목록과 결과를 요약한다.
