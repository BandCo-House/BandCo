---
name: fe-test
description: frontend/src 코드에 테스트를 작성하는 스킬. "테스트 작성해줘", "test 짜줘", "테스트 추가해줘", "이거 테스트 커버해줘", "spec 작성" 요청 시 트리거한다. 대상에 맞는 도구를 골라 계약 중심 테스트를 작성한다.
---

# Fe-Test — 테스트 작성 스킬

대상에 맞는 도구를 골라 작고 빠른 계약 테스트를 작성한다.
이 스킬은 `frontend/` 범위에서만 동작한다. `backend/` 파일은 수정하지 않는다.

> 규칙 기준: `AGENTS.md` "테스트", "MSW"

## 시점과 단위

- **화면(UI)이 구현된 뒤** 테스트를 작성한다. 동작하는 코드에 계약을 입힌다.
- e2e가 유닛 테스트를 대신하지 않게 한다. 가능한 **가장 작은 단위**로 쪼개고, e2e는 단위로 못 잡는 흐름에만 쓴다.
- 한 테스트는 하나의 계약만 검증한다.

## 검증 대상 — 쉽게 바뀌는 것은 검증하지 않는다

| 검증한다 (안정적)                          | 검증하지 않는다 (쉽게 바뀜)                 |
| ------------------------------------------ | ------------------------------------------- |
| 로직·분기·상태 전이 (disabled, 에러 표시)  | 컬러 토큰·border 두께·radius 등 스타일 값   |
| 접근성 (role, `aria-*`, label)             | 화면에 보이는 문구 텍스트 그 자체           |
| 안정적 식별자 (`role`, `data-testid`, id)  | DOM 구조·클래스명·마크업 깊이               |

- 문구를 단언 키로 쓰면 카피 한 번에 깨진다. `getByText('저장')` 대신 `getByRole('button')`·`data-testid`·로직 결과로 단언한다.
- 테스트끼리, 또는 특정 마크업에 종속되지 않게 유지한다.

## Step 1: 대상 분류 및 도구 선택

| 대상                          | 도구                       | 위치 규칙                        |
| ----------------------------- | -------------------------- | -------------------------------- |
| 순수 함수/schema/query key    | Vitest                     | 대상 파일 옆 `*.test.ts`         |
| React 컴포넌트/hook           | Testing Library + jsdom    | 대상 파일 옆 `*.test.tsx`        |
| API 함수                      | axios-mock-adapter         | `*-api.test.ts`                  |
| 사용자 흐름 + 네트워크        | MSW server                 | feature/흐름 단위 테스트         |
| focus trap/portal/scroll/caret | Playwright                | `tests/` (실제 브라우저 필요 시) |

테스트 설명(`describe`/`it`)은 구현 절차가 아니라 **계약과 로직이 보이게** 적는다. "조건 → 기대 결과" 형태로 쓴다.

```text
✅ 유효한 입력에서 회원가입 폼은 제출 버튼을 활성화한다
✅ 빈 코드일 때 초대 수락은 disabled 상태를 유지한다
❌ 버튼을 테스트한다 / 렌더링 확인
```

## Step 2: 패턴별 작성

### API 함수 — axios-mock-adapter

`src/entities/band/api/band-api.test.ts` 패턴을 따른다. `apiClient`를 mock하고 응답을 schema로 검증한 뒤 반환값을 단언한다.

```typescript
import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { getBands } from './band-api';

const mock = new MockAdapter(apiClient);
afterEach(() => mock.reset());

describe('getBands 어댑터', () => {
  it('GET /bands 응답을 schema로 검증한 뒤 bands를 반환한다', async () => {
    mock.onGet('/bands').reply(200, {
      status: 'success',
      error: null,
      data: { totalCount: 1, items: [/* ... */] },
    });
    await expect(getBands()).resolves.toEqual([/* ... */]);
  });

  it('필수 필드가 누락되면 reject된다', async () => {
    mock.onGet('/bands').reply(200, { data: { items: [{}] } });
    await expect(getBands()).rejects.toThrow();
  });
});
```

### 컴포넌트 — Testing Library

`src/shared/ui/button/button.test.tsx` 패턴을 따른다. DOM 렌더링·기본 이벤트·상태 표시를 role 쿼리로 검증한다.

```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('isLoading=true이면 버튼이 disabled 상태가 된다', () => {
    render(<Button isLoading>저장</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

접근성 단언(role, `aria-*`)을 우선 사용한다.

### 순수 함수/schema/query key — Vitest

작은 계약을 직접 단언한다.

```typescript
import { describe, expect, it } from 'vitest';
import { bandKeys } from './useBands';

describe('bandKeys', () => {
  it('lists는 all을 prefix로 가진다', () => {
    expect(bandKeys.lists()).toEqual(['bands', 'list']);
  });
});
```

## Step 3: MSW 흐름 테스트 (필요 시)

사용자 흐름 + 네트워크를 함께 검증할 때만 MSW server를 쓴다. 개별 핸들러 변경은 `server.use(...)`로 override하고 `src/test/setup.ts`의 reset 흐름을 깨지 않는다.

## Step 4: 실행

```bash
pnpm --dir frontend test
```

라우팅·auth·query invalidation·API path·접근성 상태를 건드렸으면 관련 테스트를 우선 실행한다. 실패를 무시하고 완료로 보고하지 않는다.

## 자가 확인

- [ ] 화면 구현 후, 가능한 가장 작은 단위로 작성했는가? (e2e로 유닛을 대신하지 않았는가)
- [ ] 컬러·border·문구 텍스트 같은 쉽게 바뀌는 값 대신 로직·접근성·식별자를 단언했는가?
- [ ] 특정 마크업·다른 테스트에 종속되지 않는가?
- [ ] 테스트 설명이 "조건 → 기대 결과"로 로직이 보이는가?
- [ ] API 함수 테스트가 schema 검증(성공/누락)을 모두 다루는가?
- [ ] `pnpm --dir frontend test`가 통과하는가?
