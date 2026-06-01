# 설계: common/url — buildNextPath 유틸리티

## 작업 배경

커서 기반 목록 조회에서 `next` URL path를 생성하는 로직이 모듈마다 중복되거나 일관성 없이 구현되어 있다.
(notifications는 직접 URL 문자열 생성, 나머지는 cursor 객체 반환).
공통 유틸 함수를 만들어 path 생성 방식을 통일한다.

프로토콜·오리진은 FE가 붙이며, 이 함수는 path 이하만 반환한다.

---

## 작업 범위

```
신규: src/common/url/url.util.ts
신규: src/common/url/index.ts
신규: src/common/url/url.util.spec.ts
```

---

## 함수 설계

### 시그니처

```typescript
export function buildNextPath(
  basePath: string,
  params: Record<string, string | number | boolean | null | undefined>,
): string
```

### 동작 규칙

1. `params` 객체를 순회하며 `URLSearchParams`에 추가한다.
2. 값이 `undefined` 또는 `null`인 키는 제외한다.
3. `boolean`, `number` 값은 `String()`으로 변환한다.
4. 반환값: `${basePath}?${searchParams.toString()}`

### 반환 형태 예시

```
/notifications/me?where__is_read=false&order__created_at=desc&order__id=desc&take=20&cursor__id=uuid
```

---

## 트랜잭션 경계

해당 없음 (순수 유틸리티 함수).

---

## 테스트 계획

Service가 없으므로 함수 단위 테스트만 작성한다.

| 케이스 | 설명 |
|---|---|
| happy path | basePath + 모든 params가 쿼리 문자열에 포함됨 |
| undefined 제외 | undefined 값을 가진 키는 쿼리 문자열에서 빠짐 |
| null 제외 | null 값을 가진 키는 쿼리 문자열에서 빠짐 |
| 빈 params | params가 `{}` 이면 `basePath?` 반환 |
| boolean 변환 | `true` → `"true"`, `false` → `"false"` |
| number 변환 | `20` → `"20"` |

---

## 미결 사항

없음.
