---
name: fe-api
description: 백엔드 API를 frontend/src에 연동하는 스킬. "API 연동해줘", "백엔드 연결해줘", "엔드포인트 붙여줘", "쿼리 훅 만들어줘", "mutation 추가해줘", "이 API 호출하게 해줘" 요청 시 트리거한다. 타입·schema·API 함수·훅·MSW 핸들러를 기존 패턴대로 작성한다.
---

# Fe-API — 백엔드 연동 스킬

백엔드 엔드포인트를 타입·schema·API 함수·훅·mock으로 연결한다.
이 스킬은 `frontend/` 범위에서만 동작한다. `backend/` 파일은 수정하지 않는다.

> 규칙 기준: `AGENTS.md` "API 규칙", "상태와 데이터", "타입과 schema", "MSW"

## 범위·재사용 원칙 (MVP 기준, 과설계 금지)

- 기존 API 함수·schema·query key·훅을 **최대한 재사용**한다. 비슷한 게 있으면 새로 만들지 말고 확장한다.
- 같은 로직이 여러 번 반복되면 그때 공통으로 분리한다 (`shared/lib`, entity model). 반복 전에 미리 추상화하지 않는다.
- **과하게 작성하지 않는다.** 지금 단계에서 불필요한 추상화·제네릭·이른 훅 분리·설정 레이어를 만들지 않는다. MVP 기준으로 작게 간다.
- 작업하다 범위가 커지거나 원래 의도와 다른 방향으로 흘러가면, 무리해서 끌고 가지 말고 **PR 분리를 사용자에게 제안한다.**

## Step 1: 명세 확인 — backend 최신 코드가 1차 소스

엔드포인트·요청/응답 형태는 **항상 `backend/` 폴더의 최신 코드를 읽어** 확인한다 (읽기 전용, 수정 금지). 추측하거나 오래된 문서에 의존하지 않는다.

| 확인 대상          | 위치                                                   |
| ------------------ | ------------------------------------------------------ |
| 경로·메서드·응답   | `backend/src/modules/{module}/*.controller.ts`         |
| 요청 body 필드     | `backend/src/modules/{module}/dto/*.dto.ts`            |
| 응답 모델·필드     | `backend/prisma/schema.prisma`, 관련 service 반환 타입 |
| (보조) 정리된 명세 | `backend/docs/backend/api-docs/`                       |

- endpoint는 백엔드 실제 path만 적는다 (`/bands`, `/auth/login/email`). base URL을 붙이지 않는다.
- 응답은 `status: 'success' | 'error'` + `error: string | null` + `message: string` + (성공 시) `data` 형태다. schema로 parse한 뒤 `status === 'error'`이면 throw하고 `data`를 반환한다 (`src/entities/notification/api/notification-api.ts` 패턴).
- 외부 응답은 `any`가 아니라 `unknown`으로 받아 zod로 parse하거나 타입을 좁힌다.
- backend 코드로도 불명확하면 추측하지 말고 사용자에게 확인한다.

## Step 2: 도메인 타입 + zod schema

`entities/{domain}/model/`에 타입과 schema를 둔다. schema가 있으면 `z.infer` 기반 타입을 유지한다.

```typescript
// entities/band/model/schema.ts — status 기반 응답 계약
export const bandListResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  error: z.string().nullable(),
  message: z.string(),
  data: z.object({ items: z.array(bandSchema) }),
});
```

에러 분기가 필요하면 `status`로 좁히는 discriminated union을 쓴다 (`entities/notification/model/schema.ts` 패턴).

## Step 3: API 함수

`{domain}/api/{domain}-api.ts`에 작성한다. `@/shared/api`의 `apiGet/apiPost/apiPatch/apiDelete`를 우선 쓰고, schema 검증이 필요하면 `apiClient`를 직접 쓴다.

```typescript
// entities/band/api/band-api.ts — apiClient + schema 검증 패턴
import { apiClient } from '@/shared/api';
import { bandListResponseSchema } from '../model/schema';

export const getBands = async (): Promise<Band[]> => {
  const response = await apiClient.get('/bands');
  const parsed = bandListResponseSchema.parse(response.data);
  if (parsed.status === 'error') throw new Error(parsed.message);
  return parsed.data.items;
};
```

```typescript
// 단순 호출은 helper 사용
import { apiPost } from '@/shared/api';
export const createSchedule = (data: CreateScheduleRequest) =>
  apiPost<ScheduleItem>('/schedule', data);
```

## Step 4: 훅 (TanStack Query)

| 종류       | 패턴                                                | 위치        |
| ---------- | --------------------------------------------------- | ----------- |
| 조회       | `useQuery` + query key 객체 (`bandKeys`)            | `entities/` |
| 변경(행위) | `useMutation` + `onSuccess`에서 `invalidateQueries` | `features/` |

query key는 도메인 파일에 모아 재사용한다.

```typescript
// entities/band/api/useBands.ts
export const bandKeys = {
  all: ['bands'] as const,
  lists: () => [...bandKeys.all, 'list'] as const,
};
export const useBands = () =>
  useQuery({ queryKey: bandKeys.lists(), queryFn: getBands });
```

```typescript
// features/band-create/model/useBandCreate.ts — mutation 후 invalidate
const mutation = useMutation({
  mutationFn: createBand,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: bandKeys.lists() });
  },
});
```

## 페칭 상태 설계 (없음·넘침·오류 — 필수 검토)

데이터를 불러오는 모든 화면은 **없음 / 넘침 / 오류** 세 상태를 의도적으로 설계한다. 정보의 중요도에 따라 처리 수준을 다르게 한다.

| 상태           | 핵심 정보 (없으면 화면 자체가 무의미) | 보조 정보 (일부만 빠져도 됨)                        |
| -------------- | ------------------------------------- | --------------------------------------------------- |
| 없음(empty)    | 빈 상태 안내 + 액션 유도              | "없음" 텍스트/플레이스홀더로 자리만 표시            |
| 넘침(overflow) | 페이지네이션·무한 스크롤              | 상위 N개만 노출 + 더보기(별도 목록 페이지로 라우팅) |
| 오류(error)    | 에러 화면/재시도, 필요 시 404 라우팅  | 그 블록만 "불러오지 못했어요" 표시, 나머지는 유지   |

- **핵심 정보**(예: 밴드 상세 본문)는 실패 시 페이지 전체를 에러/404로 처리한다.
- **보조 정보**(예: 공지·배너·요약 카드)는 실패해도 그 블록만 대체 문구로 보여주고 나머지 화면은 정상 렌더한다.
- 넘침은 보통 백엔드 `size`/`limit` 파라미터로 잘라 받고, 전체는 별도 목록 페이지에서 본다.
- 색·아이콘만으로 상태를 전달하지 말고 텍스트를 함께 둔다 (`AGENTS.md` 접근성).
- `useQuery`의 `isLoading`/`isError`/빈 배열을 각각 분기하고, 빈 상태와 오류 상태를 혼동하지 않는다.

## Step 5: MSW 핸들러

dev는 MSW가 요청을 가로채므로 핸들러를 함께 추가한다.

- 위치: `mocks/{domain}/handlers.ts` → `mocks/handlers.ts`에 합친다.
- endpoint 기준은 `mocks/config.ts`의 `API_URL`을 따른다.
- 실제 API path와 mock path를 일치시킨다.

## Step 6: 테스트

API 함수는 `fe-test` 스킬의 axios-mock-adapter 패턴으로 테스트를 작성한다 (성공 + 필수 필드 누락).

## 자가 확인

- [ ] 스펙을 `backend/` 최신 코드(controller·dto)에서 확인했는가?
- [ ] endpoint에 base URL을 붙이지 않았는가?
- [ ] 외부 응답을 `unknown`으로 받아 zod parse했는가?
- [ ] 기존 함수·schema·훅을 재사용했고, 과한 추상화를 만들지 않았는가?
- [ ] 조회 hook은 entities, mutation은 features에 두었는가?
- [ ] query key를 도메인 파일에 모아 재사용하고, mutation 후 invalidate했는가?
- [ ] MSW 핸들러를 `mocks/handlers.ts`에 합쳤는가?
- [ ] 없음·넘침·오류 상태를 정보 중요도(핵심=전체 에러/404, 보조=블록만 대체)에 맞게 분기했는가?
- [ ] 범위가 커지면 PR 분리를 제안했는가?
