# AGENTS.md

`frontend/src` 하위 코드를 수정하는 AI Agent용 지침이다. 현재 프론트는 **Vite + React + TypeScript**, **TanStack Router**, **TanStack Query**, **axios**, **MSW**, **Tailwind CSS v4**, **shadcn/Radix UI**, **lucide-react**, **SVG React import**를 사용한다.

## 기본 원칙

| 원칙          | 규칙                                                               |
| ------------- | ------------------------------------------------------------------ |
| 확인 우선     | 가정하지 말고 현재 코드, 테스트, 문서를 먼저 확인한다.             |
| 최소 변경     | 요청된 문제를 해결하는 데 필요한 파일과 코드만 수정한다.           |
| 단순성        | 더 단순한 접근이 있으면 이유와 함께 제시한다.                      |
| 설명 가능성   | 설명할 수 없는 추상화나 우회 코드를 작성하지 않는다.               |
| 안전성        | 파괴적 명령은 사용자가 명시적으로 요청하지 않으면 실행하지 않는다. |
| 패키지 매니저 | `pnpm`만 사용한다.                                                 |

## 레이어 구조

| 경로        | 책임                                                          | 주의점                                                          |
| ----------- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| `app/`      | 라우터 생성, provider, auth context, route guard, root layout | 앱 조립 코드만 둔다.                                            |
| `pages/`    | TanStack Router 파일 라우트                                   | 큰 화면 로직은 feature/widget/entity로 분리한다.                |
| `widgets/`  | 여러 entity/feature를 조합한 독립 UI 블록                     | 페이지 전용이어도 재사용 가능한 화면 블록이면 widget으로 둔다.  |
| `features/` | 생성, 수정, 삭제, 수락, 거절, 온보딩 등 사용자 행위           | 동일한 도메인·상태·생명주기를 공유하면 하나의 feature로 묶는다. |
| `entities/` | 도메인 model, schema, type, 조회 hook, 엔티티 UI              | feature나 widget을 import하지 않는다.                           |
| `shared/`   | API client, 공용 타입, 공용 UI, lib 유틸                      | 상위 레이어를 import하지 않는다.                                |
| `mocks/`    | MSW handler, browser/server mock 설정                         | 실제 API path와 mock path를 함께 관리한다.                      |

의존 방향은 가능하면 `app -> pages -> widgets -> features -> entities -> shared`로 유지한다. 긴 상대경로 대신 `@/...` alias를 사용한다. `routeTree.gen.ts`, `styles/generated-tokens.css`, lockfile 같은 생성물은 해당 생성 작업이 아니면 직접 편집하지 않는다.

## 작성 규칙

| 항목          | 규칙                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------- |
| 함수/컴포넌트 | 특별한 이유가 없으면 `const`와 명시적 타입을 사용한다.                                        |
| 타입 import   | 타입 전용 import는 `import type`을 사용한다.                                                  |
| 외부 응답     | `any` 대신 `unknown`으로 받고 zod parse 또는 타입 좁히기를 한다.                              |
| 주석          | 코드만으로 의도가 드러나지 않는 복잡한 흐름에만 한국어로 짧게 작성한다.                       |
| JSDoc         | 모든 함수에 달지 않는다. 공개 API, 복잡한 훅, 주의가 필요한 유틸에만 작성한다.                |
| 상수·규칙     | 조건·카테고리·매직값·라벨 매핑은 인라인 하드코딩하지 말고 변수나 객체/배열로 추출한다.        |
| 공통 재사용   | 반복되는 로직·UI·상수는 공통 모듈(`shared`, `entities`)로 분리해 재사용한다. 복붙하지 않는다. |
| 금지          | 불필요한 wrapper, 죽은 코드, 임시 console, 사용하지 않는 export를 남기지 않는다.              |

## API 규칙

| 항목          | 규칙                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 호출 방식     | `@/shared/api`의 `apiGet`, `apiPost`, `apiPatch`, `apiDelete`를 우선 사용한다. 필요할 때만 `apiClient`를 직접 쓴다.         |
| endpoint      | `/bands`, `/auth/login/email`처럼 백엔드 실제 path만 적고 base URL을 붙이지 않는다.                                         |
| base URL      | `shared/api/config.ts`와 Vite env가 담당한다.                                                                               |
| development   | 기본값은 `/api`이며 dev에서는 MSW가 요청을 가로챈다.                                                                        |
| production    | 배포 주소는 env의 `VITE_API_BASE_URL`로 주입한다.                                                                           |
| proxy         | 백엔드는 전역 `/api` prefix가 없으므로 dev proxy가 필요할 때만 `/api`를 제거해 백엔드 루트로 전달한다.                      |
| 응답 검증     | `shared/api/types.ts`와 entity schema를 확인하고, 런타임 검증이 필요한 값은 zod schema로 parse한다.                         |
| 응답 envelope | 백엔드가 `{ genres }`, `{ items }`처럼 감싸 주는지 실제 타입을 확인하고 언랩한다. 배열로 바로 받으면 조용히 빈 목록이 된다. |

## 상태와 데이터

| 항목                          | 규칙                                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 서버 상태                     | TanStack Query를 우선 사용한다.                                                                                                                                          |
| query key                     | `bandKeys`, `profileKeys`, `notificationQueries`처럼 도메인 파일에 모아 재사용한다.                                                                                      |
| mutation 후처리               | 관련 query key를 invalidate하거나 필요한 경우 `setQueryData`로 좁게 갱신한다.                                                                                            |
| 접근 권한이 사라지는 mutation | 탈퇴·삭제처럼 더 이상 볼 수 없게 되는 리소스는 목록뿐 아니라 **상세 캐시도 `removeQueries`로 지운다.** 남겨 두면 뒤로 가기로 돌아왔을 때 권한 없는 화면이 그대로 보인다. |
| 인증 token                    | `shared/lib/auth-storage.ts`와 `apiClient` interceptor 흐름을 유지한다.                                                                                                  |
| 인증 context                  | `app/providers/AuthProvider.tsx`와 `auth-context.ts`를 통한다.                                                                                                           |

## 라우팅

| 항목          | 규칙                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| 파일 라우트   | `pages/`의 TanStack Router 파일 규칙을 따른다.                                                                |
| 보호 라우트   | `app/router-guards.ts`의 `requireLogin`, `requireGuest`, `requireAdmin`, `allowBandAccess` 패턴을 재사용한다. |
| search params | zod로 검증하거나 기존 route search 처리 방식을 따른다.                                                        |
| 이동          | TanStack Router의 `Link`, `useNavigate`, `router.navigate`를 우선 사용한다.                                   |

## UI와 스타일

| 항목            | 규칙                                                                                                                                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| primitive       | `shared/ui`를 먼저 확인한다.                                                                                                                                                                                                                               |
| 버튼/입력       | `shared/ui/button`, `shared/ui/input`을 우선 사용한다.                                                                                                                                                                                                     |
| overlay/control | dialog, sheet, popover, select, checkbox, avatar, toaster는 기존 컴포넌트를 재사용한다.                                                                                                                                                                    |
| 컴포넌트 추가   | 없는 컴포넌트는 shadcn에서 받아와서 사용한다. 스타일 코드는 최대한 간략하게 줄이고 기존 스타일 변수를 활용하도록 수정하여 적용한다.                                                                                                                        |
| icon            | `assets/icons/*.svg?react`를 우선 사용하고 없다면 사용자에게 요청하거나 lucide-react를 사용한다.                                                                                                                                                           |
| styling         | Tailwind class와 `cn`/`tailwind-merge` 패턴을 사용한다.                                                                                                                                                                                                    |
| 디자인 토큰     | 토큰 기반 유틸(`rounded-*`, `bg-*`)을 쓰기 전에 `index.css`의 `@theme`에 그 스케일이 **실제로 매핑돼 있는지** 확인한다. 매핑이 없으면 Tailwind 기본값으로 조용히 렌더된다. 토큰 값에 이미 알파가 있으면(`--surface-1: #dce2f966`) `/40`을 덧붙이지 않는다. |
| semantic HTML   | 불필요한 div wrapper를 줄이고 의미 있는 요소를 우선한다.                                                                                                                                                                                                   |
| responsive      | 텍스트가 모바일에서 넘치지 않게 width, min-width, wrapping, line clamp, overflow 처리를 함께 고려한다.                                                                                                                                                     |

## 접근성

| 항목            | 규칙                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------- |
| clickable       | 클릭 가능한 요소는 실제 `button`, `a`, `input`, `select` 등 의미 있는 요소를 우선 사용한다.         |
| icon button     | 아이콘만 보이는 버튼에는 `aria-label`을 제공한다.                                                   |
| decorative icon | 장식용 아이콘은 접근성 트리에서 숨긴다.                                                             |
| form control    | visible label 또는 명확한 `aria-label`/`aria-labelledby`를 제공한다.                                |
| error message   | `aria-invalid`, `aria-describedby`, inline message를 함께 고려한다.                                 |
| keyboard        | hover만으로 기능을 숨기지 말고 keyboard focus 상태에서도 접근 가능하게 한다.                        |
| complex UI      | focus/keyboard 처리가 필요한 dialog, sheet, popover, select는 Radix 기반 primitive를 우선 사용한다. |
| status          | 색상만으로 상태를 전달하지 말고 텍스트, 아이콘, 보조 속성을 함께 사용한다.                          |
| async state     | loading/error/success는 disabled, focus 유지, toast 또는 inline message까지 함께 설계한다.          |

## 타입과 schema

| 항목        | 규칙                                                                                |
| ----------- | ----------------------------------------------------------------------------------- |
| 도메인 타입 | 가능한 `entities/*/model`에 둔다.                                                   |
| zod 타입    | schema가 있는 도메인은 `z.infer` 기반 타입을 유지한다.                              |
| API 타입    | 해당 feature/entity의 `api` 근처에 두되 여러 곳에서 공유되면 entity model로 올린다. |
| 검증 대상   | form, route search, 외부 API 응답은 기존 zod schema 패턴을 재사용한다.              |

## 테스트

| 대상                                  | 도구                    | 규칙                                           |
| ------------------------------------- | ----------------------- | ---------------------------------------------- |
| 순수 함수/schema/query key            | Vitest                  | 작고 빠르게 계약을 검증한다.                   |
| React 컴포넌트/hook                   | Testing Library + jsdom | DOM 렌더링, 기본 이벤트, 상태 표시를 검증한다. |
| API 함수                              | axios-mock-adapter      | 기존 패턴처럼 `apiClient`를 mocking한다.       |
| 사용자 흐름 + 네트워크                | MSW server              | 실제 상호작용과 mock API 응답을 함께 검증한다. |
| focus trap/portal/scroll/resize/caret | Playwright              | 실제 브라우저 동작이 필요한 경우에 사용한다.   |

테스트 설명은 구현 절차보다 계약을 적는다. 예: `유효한 입력에서 회원가입 폼은 제출 버튼을 활성화한다`. 라우팅, auth, query invalidation, API path, 접근성 상태를 건드리면 관련 테스트를 우선 실행한다.

## MSW

| 항목            | 규칙                                                              |
| --------------- | ----------------------------------------------------------------- |
| browser worker  | `main.tsx`에서 dev일 때만 켜진다.                                 |
| handler 위치    | `mocks/{domain}/handlers.ts`에 두고 `mocks/handlers.ts`에 합친다. |
| endpoint 기준   | `mocks/config.ts`의 `API_URL`을 따른다.                           |
| 테스트 override | 개별 handler 변경은 `server.use(...)`를 사용한다.                 |
| cleanup         | `src/test/setup.ts`의 reset 흐름을 깨지 않는다.                   |

## 검증

| 상황           | 명령                                                |
| -------------- | --------------------------------------------------- |
| 최소 타입 검증 | `pnpm --dir frontend exec tsc -b`                   |
| 포맷 확인      | `pnpm --dir frontend exec prettier --check <files>` |
| lint           | `pnpm --dir frontend run lint`                      |
| test           | `pnpm --dir frontend test`                          |

스타일이나 접근성에 영향을 주면 관련 컴포넌트 테스트 또는 브라우저 확인을 추가한다. 검증 실패를 무시하고 완료로 보고하지 않는다.
