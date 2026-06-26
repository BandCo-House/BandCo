# Band 모듈 개선 설계

> 작성일: 2026-06-26
> 대상 API: #10 GET /bands/me, #11 GET /bands/{bandId}/users, #12 GET /bands/search

---

## 작업 개요

현재 `findBandMembers`, `findMyBands`, `searchBands` 세 Repository 메서드에서 `meta.next`가
커서 객체(`{ joinedAt, id }` 등)로 반환된다. User 모듈의 `buildNextPath` 패턴을 적용해
`string | null` (URL 경로 문자열)로 변환한다.

`parseToPrismaQuery` 적용은 아래 "parseToPrismaQuery 적용 여부 분석" 참조.

---

## 작업 범위

```
수정: src/modules/bands/types/band-member-list.type.ts
      src/modules/bands/types/band-search-result.type.ts
      src/modules/bands/types/my-band-list.type.ts
      src/modules/bands/repositories/bands.prisma-repository.ts
      src/modules/bands/repositories/bands.prisma-repository.spec.ts
```

docs 갱신 (이미 완료):
```
수정: docs/backend/api-docs/band.md
```

---

## parseToPrismaQuery 적용 여부 분석

### searchBands

`SearchBandsQueryDto`는 `where__name__contain`, `order__created_at`, `order__id`, `take`,
`cursor__created_at`, `cursor__id`를 가진다.

`parseToPrismaQuery` 적용 시:
- `where__name__contain` → `where.name__contain`이 아니라 `where.name` `contain` 연산자로 파싱됨
  (파서가 `where__name__contain`을 `where + name + contain`으로 분리)
- `order__created_at`, `order__id` → `orderBy` 배열로 정상 파싱
- `take` → `take`로 정상 파싱

단, 현재 코드는 `createBandSearchKeywordWhere`로 키워드 필터를 별도 구성하고,
`createBandSearchCursorWhere`로 커서 조건을 별도 구성한 뒤 스프레드한다.
`parseToPrismaQuery`를 쓰면 `where` 파싱 결과의 `name`이 `{ contains, mode: 'insensitive' }` 형태가 되어
기존 `createBandSearchKeywordWhere`와 동일한 결과를 내지만,
커서 조건(`cursor__created_at`, `cursor__id`)은 `where` 접두사가 없으므로 파서가 무시한다.

**결론:** `parseToPrismaQuery`는 `orderBy`와 `take` 파싱에만 이득이 있고,
`where` 키워드 처리는 기존 private 메서드와 동일한 출력을 내므로 교체해도 동작은 같다.
그러나 `mode: 'insensitive'`와 `contains` 연산자 처리가 파서 내부에 숨겨지고,
커서 조건은 여전히 별도 처리해야 하므로 코드가 더 복잡해진다.

**최종 결정: searchBands에 parseToPrismaQuery 적용한다.**
설계 단계에서는 적용하지 않는 것으로 분석했으나, 사용자가 User 모듈과 일관성을 위해 적용을 승인하였다.
`createBandSearchKeywordWhere` private 메서드를 제거하고 `parseToPrismaQuery`의 `where` 결과로 대체.
커서 조건은 `createBandSearchCursorWhere`에서 계속 처리한다.

### findBandMembers

`GetBandMembersQueryDto`에는 `order__joined_at`, `order__id` 파라미터가 있지만
`where__*` 패턴 필드가 없다. `parseToPrismaQuery`를 쓰면 `orderBy`와 `take`는 파싱되어
기존 하드코딩 방식보다 User 모듈과 일관성이 높아진다.

**최종 결정: findBandMembers에 parseToPrismaQuery 적용한다.** (사용자 승인)

### findMyBands

`GetMyBandsQueryDto`에 `order__*` 파라미터 자체가 없다. 현재 코드는 `orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]`로 고정 정렬한다. 적용 이익 없음.

**결론: findMyBands에는 parseToPrismaQuery 적용하지 않는다.** (정렬 고정이므로 이득 없음)

---

## next 타입 변경 계획

### 변경 대상 타입 파일

**`src/modules/bands/types/band-member-list.type.ts`**
- `BandMemberListCursor` 인터페이스는 유지 (cursor 필드에서 계속 사용)
- `GetBandMembersResult.meta.next` 타입: `BandMemberListCursor | null` → `string | null`

**`src/modules/bands/types/band-search-result.type.ts`**
- `BandSearchCursor` 인터페이스는 유지 (cursor 필드에서 계속 사용)
- `SearchBandsResult.meta.next` 타입: `BandSearchCursor | null` → `string | null`

**`src/modules/bands/types/my-band-list.type.ts`**
- `MyBandListCursor` 인터페이스는 유지 (cursor 필드에서 계속 사용)
- `GetMyBandsResult.meta.next` 타입: `MyBandListCursor | null` → `string | null`

### 변경 후 타입 정의

```typescript
// band-member-list.type.ts
export interface GetBandMembersResult {
  bandId: string;
  members: BandMemberListItem[];
  meta: {
    count: number;
    take: number;
    cursor: BandMemberListCursor | null;
    next: string | null;  // 변경: BandMemberListCursor | null → string | null
  };
}

// band-search-result.type.ts
export interface SearchBandsResult {
  keyword: string | null;
  items: BandSearchListItem[];
  meta: {
    count: number;
    take: number;
    cursor: BandSearchCursor | null;
    next: string | null;  // 변경: BandSearchCursor | null → string | null
  };
}

// my-band-list.type.ts
export interface GetMyBandsResult {
  items: MyBandListItem[];
  meta: {
    count: number;
    take: number;
    cursor: MyBandListCursor | null;
    next: string | null;  // 변경: MyBandListCursor | null → string | null
  };
}
```

---

## buildNextPath 적용 위치 (Repository 구현체)

`src/modules/bands/repositories/bands.prisma-repository.ts`에서 세 메서드의 `next` 계산 부분을 변경한다.
import에 `buildNextPath` 추가 필요.

### findBandMembers

현재:
```typescript
const next = count === query.take ? { joinedAt: members[count - 1].joinedAt, id: members[count - 1].bandMemberId } : null;
```

변경 후:
```typescript
const lastMember = members[count - 1];
const next =
  count === query.take && lastMember
    ? buildNextPath(`/bands/${bandId}/users`, {
        cursor__joined_at: lastMember.joinedAt,
        cursor__id: lastMember.bandMemberId,
        take: query.take,
        order__joined_at: query.order__joined_at,
        order__id: query.order__id,
      })
    : null;
```

### searchBands

현재:
```typescript
const next = count === query.take ? { createdAt: items[count - 1].createdAt, id: items[count - 1].bandId } : null;
```

변경 후:
```typescript
const lastItem = items[count - 1];
const next =
  count === query.take && lastItem
    ? buildNextPath('/bands/search', {
        cursor__created_at: lastItem.createdAt,
        cursor__id: lastItem.bandId,
        take: query.take,
        order__created_at: query.order__created_at,
        order__id: query.order__id,
        where__name__contain: query.where__name__contain,
      })
    : null;
```

### findMyBands

현재:
```typescript
const next = count === query.take ? { createdAt: items[count - 1].createdAt, id: items[count - 1].id } : null;
```

변경 후:
```typescript
const lastBand = items[count - 1];
const next =
  count === query.take && lastBand
    ? buildNextPath('/bands/me', {
        cursor__created_at: lastBand.createdAt,
        cursor__id: lastBand.id,
        take: query.take,
      })
    : null;
```

> `findMyBands`는 정렬이 `createdAt DESC, id DESC`로 고정이므로 `order__*` 파라미터를 next URL에 포함하지 않는다.
> DTO에 `order__*` 필드가 없기 때문.

---

## 트랜잭션 경계

세 메서드 모두 읽기 전용이므로 트랜잭션 경계 변경 없음. `tx?` 인자 유지.

---

## 테스트 계획

### bands.prisma-repository.spec.ts 수정

현재 spec 파일에 `findBandMembers`, `findMyBands`, `searchBands` describe 블록이 없다.
이번 변경으로 `next` 값이 바뀌므로 새 describe 블록을 추가한다.

#### findBandMembers

| 케이스 | 내용 |
|-------|------|
| happy path (next = null) | take=20, 결과 1건 → next가 null |
| next가 URL 문자열 반환 | take=1, 결과 1건 → next가 `/bands/{bandId}/users?...` 형태 문자열 |
| cursor 조건 적용 | cursor__joined_at + cursor__id 있으면 OR 커서 where 적용 확인 |

```typescript
describe('findBandMembers', () => {
  it('next가 없으면 null을 반환한다', async () => {
    // take: 20, 결과: 1건 → next === null
    expect(result.meta.next).toBeNull();
  });

  it('take만큼 조회되면 next URL을 반환한다', async () => {
    // take: 1, 결과: 1건 → next가 string
    expect(typeof result.meta.next).toBe('string');
    expect(result.meta.next).toContain('/bands/band-001/users');
    expect(result.meta.next).toContain('cursor__joined_at=');
    expect(result.meta.next).toContain('cursor__id=');
  });
});
```

#### searchBands

| 케이스 | 내용 |
|-------|------|
| happy path (next = null) | take=20, 결과 1건 → next가 null |
| next가 URL 문자열 반환 | take=1, 결과 1건 → next가 `/bands/search?...` 형태 문자열 |
| where__name__contain 있으면 next URL에 포함 | 키워드가 next URL 쿼리에 포함 |

#### findMyBands

| 케이스 | 내용 |
|-------|------|
| happy path (next = null) | take=20, 결과 1건 → next가 null |
| next가 URL 문자열 반환 | take=1, 결과 1건 → next가 `/bands/me?...` 형태 문자열 |

### bands.service.spec.ts 수정

`findBandMembers`, `findMyBands`, `searchBands` Stub 반환 값에서 `meta.next`가 `null`로 고정되어 있다.
현재 Service는 next를 그대로 통과시키므로 stub 수정 불필요. 다만 타입 변경 후
TypeScript가 기존 stub의 `next: null`을 `string | null`로 허용하므로 컴파일 오류 없음.

---

## API 번호

- #10 GET /bands/me — 기존
- #11 GET /bands/{bandId}/users — 기존
- #12 GET /bands/search — 기존
- #13 PATCH /bands/{bandId} — 기존 (불명확 항목 확정, 명세 갱신)
- #8 DELETE /bands/{bandId} — 기존 (인증 필요 확정, 명세 갱신)

---

## 설계 품질 체크리스트

- [x] 수정 파일 목록이 명확한가?
- [x] Repository 메서드 시그니처 변경 없음 (반환 타입의 `next` 필드만 변경)
- [x] 트랜잭션 경계 변경 없음
- [x] 테스트 케이스: happy path + next URL 반환 케이스 정의됨
- [x] Prisma 모델과 설계 일치 (변경 없음)
- [x] Controller/Service 변경 없음 (next는 Repository에서 생성되어 그대로 통과)

---

## 미결 사항

1. **parseToPrismaQuery 적용 관련**: 현재 `searchBands`, `findBandMembers`, `findMyBands`에
   parseToPrismaQuery 적용 시 기존 private 메서드와 동일한 동작이지만 추상화 복잡도가 올라간다.
   `next` 변환 이후 별도 리팩터링 이슈로 분리 권장.

2. **`GetBandMembersResult.cursor` 필드 방향**: API 명세(#11)에서 cursor가 첫 번째 아이템 기준인지
   마지막 아이템 기준인지 명시되지 않았다. 현재 코드는 `cursor = items[0]`(첫 번째)을 사용하는데,
   User 모듈은 `items[0]`을 사용한다. 일관성 유지 — 변경 불필요.

3. **`findBandMembers` 인증 범위**: 현재 Service(`getBandMembers`) 코드는 인증 없이 밴드 존재만
   확인 후 멤버를 반환한다. API 명세 #11은 401(인증 실패)/403(밴드 멤버 아님) 에러를 명시하지만,
   컨트롤러 코드를 별도 확인 필요 (이번 작업 범위 외).
