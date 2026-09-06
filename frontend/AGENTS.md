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

| 항목        | 규칙                                                                                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 호출 방식   | `@/shared/api`의 `apiGet`, `apiPost`, `apiPatch`, `apiDelete`만 사용한다. `apiClient`를 직접 호출하는 API 함수는 만들지 않는다(토큰 재발급 등 `shared/api/client.ts` 내부만 예외).                              |
| endpoint    | `/bands`, `/auth/login/email`처럼 백엔드 실제 path만 적고 base URL을 붙이지 않는다.                                                                                                                             |
| base URL    | `shared/api/config.ts`와 Vite env가 담당한다.                                                                                                                                                                   |
| development | 기본값은 `/api`이며 dev에서는 MSW가 요청을 가로챈다.                                                                                                                                                            |
| production  | 배포 주소는 env의 `VITE_API_BASE_URL`로 주입한다.                                                                                                                                                               |
| proxy       | 백엔드는 전역 `/api` prefix가 없으므로 dev proxy가 필요할 때만 `/api`를 제거해 백엔드 루트로 전달한다.                                                                                                          |
| 응답 봉투   | 백엔드 응답은 항상 `{ status, error, message, data }` 봉투다(`shared/api/types.ts`의 `ApiSuccessResponse`·`ApiFailResponse`). `apiGet`류가 `data`만 돌려주므로 API 함수와 schema는 봉투를 다시 정의하지 않는다. |
| 응답 검증   | `shared/api/types.ts`와 entity schema를 확인하고, 런타임 검증이 필요한 값은 `apiGet<unknown>`으로 받아 zod schema로 parse한다.                                                                                  |
| 실패 응답   | 4xx·5xx는 `{ status: 'fail', error: { code, details: { statusCode } }, message, data: {} }`로 오고 axios가 reject한다. 사용자 메시지는 `getApiErrorMessage`로 읽는다.                                           |
| data 형태   | `data` 안은 API마다 다르다. 백엔드가 `{ genres }`, `{ items }`처럼 감싸 주는지 실제 타입(`backend/src/modules/*/types`)을 확인하고 언랩한다.                                                                    |

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
| 타이포그래피    | 아래 "타이포그래피와 색" 절을 따른다. 크기·굵기는 `typo-*` 유틸로만 지정한다.                                                                                                                                                                              |
| 텍스트 색       | 아래 "타이포그래피와 색" 절을 따른다. 토큰만 쓰고 hex 리터럴·Tailwind 기본 팔레트는 쓰지 않는다.                                                                                                                                                           |
| 경고 표시       | 특정 입력칸에 붙는 경고는 인라인 `<p>` + `aria-invalid`/`aria-describedby`로, 어느 칸인지 특정할 수 없는 폼 단위 경고는 `toast.error`로 알린다.                                                                                                            |
| semantic HTML   | 불필요한 div wrapper를 줄이고 의미 있는 요소를 우선한다.                                                                                                                                                                                                   |
| responsive      | 텍스트가 모바일에서 넘치지 않게 width, min-width, wrapping, line clamp, overflow 처리를 함께 고려한다.                                                                                                                                                     |

## 타이포그래피와 색

### 조합은 이 표 밖으로 나가지 않는다

`index.css`의 `@utility`에 정의된 것이 전부다. 여기 없는 조합이 필요하면 만들지 말고 **먼저 물어본다.**

| px  | 700 `-b`      | 600 `-sb`      | 400 `-r`      | 쓰는 곳                                          |
| --- | ------------- | -------------- | ------------- | ------------------------------------------------ |
| 32  | `typo-3xl-b`  | —              | —             | 히어로 (프로필 이름, 온보딩 대표 문구)           |
| 24  | —             | `typo-xl-sb`   | —             | 페이지·모달·상세 제목                            |
| 18  | `typo-lg-b`   | `typo-lg-sb`   | —             | 섹션 제목, 폼 라벨, 시트/다이얼로그 제목         |
| 16  | `typo-base-b` | `typo-base-sb` | `typo-base-r` | 본문, 버튼, 리스트 행 주제목                     |
| 14  | `typo-sm-b`   | `typo-sm-sb`   | `typo-sm-r`   | 보조 본문, 빈 상태 안내문구, 도움말, 에러 메시지 |
| 12  | —             | `typo-xs-sb`   | `typo-xs-r`   | 캡션, 태그, 메타(날짜·개수)                      |

- **500(medium)·20px·28px은 없다.** 흡수된 값이라 되살리지 않는다.
- **안내문구를 12로 내리지 않는다.** 태그·날짜 같은 메타와 같은 위계가 된다.
- 그리드 카드 주제목은 18, 리스트 행 주제목은 16이다.

> **`typo-*`와 Tailwind 기본 유틸을 같은 요소에 함께 쓰지 않는다.**
> `typo-sm-sb text-xs`는 14로 쓴 줄 알아도 병합 순서가 승자를 정해 12로 렌더된다.
> 에러가 나지 않아 눈으로만 찾아야 하는 종류의 버그다. `text-sm`·`font-bold`·`text-[13px]` 모두 해당한다.
>
> 명시도가 더 높은 서드파티 규칙(sonner의 `[data-sonner-toast][data-styled] [data-title]` 등)
> 위에 얹을 때는 `typo-base-sb!`처럼 `!`를 붙여야 굵기·행간까지 적용된다.

### 색은 토큰만 쓴다

`text-grey-*`, `text-primary`, `text-destructive`, `bg-surface-*` 등. **hex 리터럴과 Tailwind 기본 팔레트(`slate`/`violet`/`gray`/`rose`/`red`)는 쓰지 않는다.**

토큰이 hex 8자리로 정의돼 있어 `rgba()` 리터럴과 같은 값인지 눈에 안 보인다. 박기 전에 대조한다.

| 리터럴                  | 토큰              | 리터럴    | 토큰                 |
| ----------------------- | ----------------- | --------- | -------------------- |
| `rgba(220,226,249,0.4)` | `surface-1`       | `#9D9D9F` | `grey-300`           |
| `rgba(97,117,158,0.56)` | `surface-2`       | `#C6C6C8` | `grey-200`           |
| `rgba(101,99,122,0.48)` | `surface-3`       | `#DFDFE1` | `grey-100`           |
| `rgba(39,43,34,0.8)`    | `primary-surface` | `#646468` | `grey-400`           |
| `#1B1B32`               | `gradient-top`    | `#ECFCAB` | `primary` (다크)     |
| `#020119`               | `gradient-bottom` | `#D6705C` | `destructive` (다크) |

토큰 값에 이미 알파가 있으면(`--surface-1: #dce2f966`) `/40`을 덧붙이지 않는다. `surface-3`(alpha 0.48)에 `/30` 같은 다른 알파가 필요하면 만들지 말고 물어본다.

### 기존 스펙과 다르면 먼저 알린다

디자인 시안이 위 표나 기존 컴포넌트와 다를 때 **그대로 구현하지 않는다.** 비슷한 것이 이미 있는지 찾아 대조하고, 차이를 알린 뒤 진행 여부를 묻는다.

| 상황                      | 대조 대상                                                                |
| ------------------------- | ------------------------------------------------------------------------ |
| 모달·시트 제목            | `shared/ui/dialog.tsx` `DialogTitle`, `shared/ui/sheet.tsx` `SheetTitle` |
| 빈 상태·결과 없음         | `shared/ui/empty-state.tsx` `EmptyState`                                 |
| 리스트 카드 주제목        | `entities/band/ui/BandCard.tsx`, `widgets/notification-list`             |
| 헤더 탭                   | `widgets/page-header/route-tabs.tsx` `RouteTabs`                         |
| 버튼 크기·굵기            | `shared/ui/button/button-variants.ts`                                    |
| 새 색·새 크기가 필요할 때 | `index.css` `@utility`, `styles/generated-tokens.css`                    |

보고 형식은 아래처럼 짧게 한다. 임의로 시안을 따르지도, 임의로 기존 값으로 바꾸지도 않는다.

```
시안: 모달 제목 20px / 600
기존: DialogTitle이 typo-lg-sb(18px / 600) — 시트 제목과 맞춘 값

20px은 스케일에 없는 값이에요. 18로 맞출까요, 시안대로 20을 새로 추가할까요?
```

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

| 항목            | 규칙                                                                                                                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| browser worker  | `main.tsx`에서 dev일 때만 켜진다.                                                                                                                                                                                                      |
| handler 위치    | `mocks/{domain}/handlers.ts`에 두고 `mocks/handlers.ts`에 합친다.                                                                                                                                                                      |
| endpoint 기준   | `mocks/config.ts`의 `API_URL`을 따른다.                                                                                                                                                                                                |
| 응답 형태       | 성공은 `{ status: 'success', error: null, message, data }`, 실패는 `{ status: 'fail', error: { code, details: { statusCode } }, message, data: {} }`로 백엔드 봉투를 그대로 흉내 낸다. `data`는 백엔드 result 타입과 같은 형태로 둔다. |
| 테스트 override | 개별 handler 변경은 `server.use(...)`를 사용한다.                                                                                                                                                                                      |
| cleanup         | `src/test/setup.ts`의 reset 흐름을 깨지 않는다.                                                                                                                                                                                        |

## 검증

| 상황           | 명령                                                |
| -------------- | --------------------------------------------------- |
| 최소 타입 검증 | `pnpm --dir frontend exec tsc -b`                   |
| 포맷 확인      | `pnpm --dir frontend exec prettier --check <files>` |
| lint           | `pnpm --dir frontend run lint`                      |
| test           | `pnpm --dir frontend test`                          |

스타일이나 접근성에 영향을 주면 관련 컴포넌트 테스트 또는 브라우저 확인을 추가한다. 검증 실패를 무시하고 완료로 보고하지 않는다.
