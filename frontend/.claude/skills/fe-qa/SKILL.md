---
name: fe-qa
description: frontend/src 변경을 시니어 개발자 시선으로 검증하는 QA 스킬. "QA 해줘", "검증해줘", "코드 리뷰", "리뷰해줘", "merge 전에 봐줘" 요청 시 트리거한다. 구현하지 않고 검증과 보고만 수행한다.
---

# Fe-QA — 프론트엔드 QA 검증 스킬

변경된 코드가 컨벤션을 준수하는지 검증한다. **구현하지 않는다. 검증과 보고만 한다.**
이 스킬은 `frontend/` 범위에서만 동작한다. `backend/` 파일은 수정하지 않는다.

> 규칙 기준: `AGENTS.md` 전체 컨벤션 표

문제는 반드시 `파일경로:라인번호` 형식으로 위치를 명시한다.

## Step 1: 변경 파일 확인

```bash
git diff --name-only HEAD
```

변경 파일 목록을 확인하고 각 파일을 읽는다. `frontend/` 밖 변경은 검토 대상에서 제외한다.

## Step 2: 체크리스트 검증

`AGENTS.md` 해당 섹션 기준으로 검증한다. 아래는 quick-reference다.

**레이어 / 의존 방향** ("레이어 구조")

- [ ] 구현 위치가 책임에 맞는가? (행위→features, 화면 블록→widgets, 도메인→entities, 공용→shared)
- [ ] 의존 방향이 `app → pages → widgets → features → entities → shared`를 지키는가?
- [ ] `entities`가 feature/widget을, `shared`가 상위 레이어를 import하지 않는가?
- [ ] 생성물(`routeTree.gen.ts`, `generated-tokens.css`)을 직접 편집하지 않았는가?

**작성 규칙** ("작성 규칙", "타입과 schema")

- [ ] `const` + 명시적 타입, 타입 전용 import는 `import type`인가?
- [ ] 외부 응답을 `any` 대신 `unknown` + zod parse/타입 좁히기로 받았는가?
- [ ] 조건·매직값·라벨 매핑을 인라인 하드코딩하지 않고 변수·객체/배열로 추출했는가?
- [ ] 반복 로직·UI를 복붙하지 않고 공통(`shared`/`entities`)으로 재사용했는가?
- [ ] 죽은 코드·임시 console·미사용 export가 없는가?

**API / 상태** ("API 규칙", "상태와 데이터")

- [ ] `@/shared/api` helper를 우선 썼고 endpoint에 base URL을 붙이지 않았는가?
- [ ] query key를 도메인 파일에서 재사용하고, mutation 후 invalidate했는가?

**UI / 스타일** ("UI와 스타일")

- [ ] raw hex/px 대신 토큰 기반 Tailwind 클래스를 썼는가? (hex 리터럴·slate/violet/gray 팔레트 금지)
- [ ] 글자 크기·굵기를 `typo-*`로만 지정했는가? `text-sm`·`font-bold` 같은 Tailwind 기본 유틸과 **같은 요소에 겹쳐 쓰지 않았는가?** (컴포넌트 기본 className + 호출부 className이 합쳐지는 경우 포함)
- [ ] 스케일 밖 값(20px·28px·13px·10px·weight 500)을 쓰지 않았는가? — `AGENTS.md` "타이포그래피와 색" 표
- [ ] 안내문구(빈 상태·도움말·에러)를 12로 내리지 않았는가? 기준은 14다
- [ ] `shared/ui` 기존 컴포넌트를 재사용했는가? (빈 상태는 `EmptyState`, 헤더 탭은 `RouteTabs`)

**접근성** ("접근성")

- [ ] 아이콘 버튼 `aria-label`, clickable은 의미 있는 요소, 색만으로 상태 전달 금지를 지켰는가?

**테스트** ("테스트")

- [ ] 변경된 함수/컴포넌트에 테스트가 있고, 설명이 계약 중심인가?

## Step 3: 검증 명령 실행

`AGENTS.md` "검증" 표 순서로 실행한다. (frontend에는 `verify.sh`가 없다.)

```bash
pnpm --dir frontend exec tsc -b
pnpm --dir frontend exec prettier --check .
pnpm --dir frontend run lint
pnpm --dir frontend test
```

실패 시 에러 메시지 전체를 리포트에 포함한다.

## QA 리포트 형식

```markdown
## QA 리포트

### 체크리스트 결과

| 항목                          | 결과  | 위치      |
| ----------------------------- | :---: | --------- |
| 레이어/의존 방향              | ✅/❌ | 파일:라인 |
| 작성 규칙 (const·import type) | ✅/❌ | 파일:라인 |
| 외부 응답 unknown + zod       | ✅/❌ | 파일:라인 |
| API helper·endpoint 형식      | ✅/❌ | 파일:라인 |
| query key 재사용·invalidate   | ✅/❌ | 파일:라인 |
| 토큰·shared/ui 재사용         | ✅/❌ | 파일:라인 |
| 접근성                        | ✅/❌ | 파일:라인 |
| 테스트 존재·계약 서술         | ✅/❌ | 파일:라인 |

### 검증 명령 결과

tsc / prettier / lint / test: ✅ 통과 / ❌ 실패

실패 내용:
(에러 메시지 그대로)

### 수정 필요 항목

1. [파일경로:라인번호] 문제 내용 — 수정 방향

### 판정

✅ QA 통과 / ❌ QA 실패 (수정 후 재실행 필요)
```

## 자가 확인

- [ ] 구현하지 않고 검증·보고만 했는가?
- [ ] 모든 지적에 `파일:라인` 위치를 명시했는가?
- [ ] 4개 검증 명령을 모두 실행하고 결과를 포함했는가?
