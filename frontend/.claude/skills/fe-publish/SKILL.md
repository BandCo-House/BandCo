---
name: fe-publish
description: Figma 디자인을 가져와 frontend/src에 컴포넌트로 구현하는 스킬. "피그마 적용", "figma 디자인 구현해줘", "이 화면 만들어줘", "캡쳐한 디자인대로 만들어줘", figma.com URL 제공 시 트리거한다. 기존 디자인 토큰과 shared/ui 컴포넌트를 재사용해 구현한다.
---

# Fe-publish — Figma 디자인 구현 스킬

Figma 디자인을 가져와 기존 토큰·컴포넌트 위에 구현한다. raw 값을 그대로 박지 않는다.
이 스킬은 `frontend/` 범위에서만 동작한다. `backend/` 파일은 수정하지 않는다.

> 규칙 기준: `AGENTS.md` "UI와 스타일", "접근성", "레이어 구조", "작성 규칙"

## Step 1: 대상 노드 특정

Figma URL에서 `fileKey`와 `nodeId`를 추출한다.

```
figma.com/design/{fileKey}/{name}?node-id=1-2  →  fileKey={fileKey}, nodeId=1:2
```

`node-id`의 `-`는 `:`로 바꾼다. URL에 `node-id`가 없으면 노드별 URL을 사용자에게 요청한다.

## Step 2: 디자인 컨텍스트 확보

읽기 전용 도구만 사용한다. 디자인을 Figma에 쓰는 `use_figma`는 사용하지 않는다.

| 목적            | 도구                                           |
| --------------- | ---------------------------------------------- |
| 코드·구조·스크린샷 | `mcp__claude_ai_Figma__get_design_context`     |
| 시각 확인       | `mcp__claude_ai_Figma__get_screenshot`         |
| 변수(색/spacing) | `mcp__claude_ai_Figma__get_variable_defs`      |
| 레이어 개요     | `mcp__claude_ai_Figma__get_metadata`           |

`get_design_context`가 돌려주는 코드는 **참고용**이다. 그대로 붙이지 말고 아래 단계로 우리 코드에 맞게 옮긴다.

## Step 3: 레이아웃 구조를 트리로 파악

코드를 짜기 전에 디자인을 **레이아웃 트리**로 먼저 분해한다. 어떤 영역이 반복되는지, 어디까지가 하나의 블록인지 구조를 먼저 잡는다.

```
화면 (page/widget)
├─ 헤더 (page-header? 재사용)
├─ 본문 영역
│  ├─ 카드 리스트 (반복 → 단일 카드 컴포넌트 + map)
│  │  └─ 카드 = 아바타 + 제목 + 상태 badge
│  └─ 빈 상태 (empty state)
└─ 하단 액션 (button)
```

- 반복되는 항목은 단일 컴포넌트 + `map`으로 묶는다 (디자인의 카드 5개를 각각 만들지 않는다).
- 트리 노드마다 "이건 화면 블록인가 / 행위인가 / 도메인 UI인가 / 공용 primitive인가"를 메모해 둔다 (Step 6 배치 근거).

## Step 4: 컴포넌트 매칭 → 신규 추출 → 우선순위

트리의 각 노드를 기존 자산과 매칭하고, 매칭되지 않는 것만 새로 만든다. **우선순위 순으로 적용한다.**

| 우선순위 | 처리                                                                                  |
| :------: | ------------------------------------------------------------------------------------- |
|    1     | `src/shared/ui` 기존 primitive 재사용 (button/input/dialog/sheet/select/avatar 등)    |
|    2     | 기존 `widgets`·`entities` 컴포넌트 재사용 또는 조합 (`page-header`, `BandCard` 등)     |
|    3     | 없는 primitive는 shadcn에서 받아와 스타일 최소화 + 토큰 변수 활용                       |
|    4     | 그래도 없으면 신규 컴포넌트 작성 — 스타일은 최소, 색·spacing은 토큰, 반복은 props로 일반화 |

아이콘은 `src/assets/icons/*.svg?react`를 우선 쓰고 없으면 lucide-react를 쓴다. 없는 아이콘은 사용자에게 요청한다.

**신규 상세 스타일 추출:** 우선순위 3·4에 해당하는 노드만 Figma에서 상세 스타일(레이아웃·spacing·radius·상태별 색)을 추출한다. 1·2로 해결되는 노드는 상세 스타일을 추출하지 않는다 (기존 컴포넌트 스타일을 신뢰).

## Step 5: 값 → 토큰 매핑 (필수)

Figma의 raw hex/px를 직접 쓰지 않는다. 토큰 체계로 매핑한다.

- 색·반경·spacing은 `src/styles/generated-tokens.css`의 CSS 변수로 정의되어 있다 (생성물이므로 직접 편집 금지).
- `src/index.css`의 `@theme inline`이 변수를 Tailwind 클래스로 노출한다.
- 따라서 Tailwind 유틸 클래스로 적용한다.

| Figma 값                    | 매핑 결과 (Tailwind 클래스)            |
| --------------------------- | -------------------------------------- |
| 배경 `#020119` (primary)    | `bg-primary`                           |
| 본문 텍스트                 | `text-foreground`                      |
| 카드/surface                | `bg-card`, `bg-primary-surface`        |
| 강조색 `#e1fc73`            | `bg-secondary` / `text-secondary`      |
| 위험 액션                   | `text-destructive`, `bg-destructive`   |
| 라운드 999px                | `rounded-full`                         |
| 라운드 16px                 | `rounded-2xl`                          |

매칭되는 토큰이 없으면 임의 hex를 박지 말고 사용자에게 토큰 추가가 필요한지 확인한다. 토큰 추가가 필요하면 `tokens/tokens.json`을 출처로 다루고 `pnpm --dir frontend run tokens:build`로 재생성한다.

스타일은 Tailwind class + `cn`(`@/shared/lib/utils`) 패턴으로 작성한다. 불필요한 div wrapper를 줄이고 의미 있는 요소를 우선한다.

## Step 6: 레이어 배치와 접근성

- Step 3 트리 메모를 근거로 배치한다 (`AGENTS.md` "레이어 구조"): 화면 블록 → `widgets/`, 사용자 행위 → `features/`, 도메인 UI → `entities/*/ui`, 공용 primitive → `shared/ui`.
- 긴 상대경로 대신 `@/...` alias를 쓴다.
- 접근성은 `AGENTS.md` "접근성" 표를 적용한다: 아이콘 전용 버튼 `aria-label`, 장식 아이콘 숨김, clickable은 실제 `button`/`a`, 색만으로 상태 전달 금지, 모바일 overflow 처리.
- **아이콘 버튼은 반드시** (1) `aria-label`로 글자 접근성을 챙기고, (2) 아이콘이 작아도 `padding`(필요하면 `-margin`으로 레이아웃 보정)으로 **충분한 클릭 가능 범위**(최소 터치 타깃)를 확보한다. 아이콘 크기만큼만 클릭되게 두지 않는다.

## 자가 확인

- [ ] 구현 전에 레이아웃을 트리로 분해하고 반복 항목을 단일 컴포넌트로 묶었는가?
- [ ] 우선순위(shared → 기존 조합 → shadcn → 신규) 순으로 매칭했는가?
- [ ] 신규 스타일 추출은 우선순위 3·4 노드에만 했는가?
- [ ] raw hex/px 대신 토큰 기반 Tailwind 클래스로 적용했는가?
- [ ] `generated-tokens.css`를 직접 편집하지 않았는가?
- [ ] 구현 위치가 레이어 구조와 의존 방향에 맞는가?
- [ ] 아이콘 버튼 `aria-label` 등 접근성을 적용하고 모바일 overflow를 처리했는가?
- [ ] 아이콘 버튼에 `aria-label` + 패딩(+필요시 -마진)으로 클릭 가능 범위를 확보했는가?
