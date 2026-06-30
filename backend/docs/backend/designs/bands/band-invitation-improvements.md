# 밴드 초대 API 개선 설계

## 작업 범위

```
수정: src/modules/bands/dto/get-received-band-invitations-query.dto.ts
      (count 필드 추가)
수정: src/modules/bands/dto/get-sent-band-invitations-query.dto.ts
      (count 필드 추가)
수정: src/modules/bands/types/received-band-invitation-list.type.ts
      (next 타입 변경, meta에 totalCount 추가)
수정: src/modules/bands/types/sent-band-invitation-list.type.ts
      (next 타입 변경, meta에 totalCount 추가)
수정: src/modules/bands/repositories/bands.repository.ts
      (인터페이스 시그니처는 기존 유지 — 타입 변경이 구현에만 영향)
수정: src/modules/bands/repositories/bands.prisma-repository.ts
      - findReceivedBandInvitations: next를 string | null로 변경, totalCount COUNT 쿼리 추가, buildNextReceivedUrl 메서드 추가
      - findSentBandInvitations: next를 string | null로 변경, totalCount COUNT 쿼리 추가, buildNextSentUrl 메서드 추가
수정: src/modules/bands/band-invitations.controller.ts
      (@ApiResponse 409 추가: accept/decline)
수정: src/modules/bands/bands.controller.ts
      (@ApiResponse 409 추가: createBandInvitation 핸들러)
수정: docs/backend/api-docs/band-invitation.md  ← 이미 완료
```

---

## API 번호

- #14 `POST /bands/{bandId}/invitations` — 409 Swagger 추가
- #15 `POST /invitations/{inviteId}/accept` — 409 Swagger 추가
- #16 `POST /invitations/{inviteId}/decline` — 409 Swagger 추가
- #18 `GET /invitations/received` — next 타입 변경, count 파라미터 추가
- #19 `GET /invitations/sent` — next 타입 변경, count 파라미터 추가

---

## DTO 정의

### GetReceivedBandInvitationsQueryDto 변경

기존 필드는 유지하고 `count` 필드를 추가한다.

```typescript
@ApiPropertyOptional({ description: '전체 개수 포함 여부. true이면 meta.totalCount에 COUNT 쿼리 결과 포함', default: false })
@Transform(parseOptionalBooleanValue)
@IsOptional()
@IsBoolean({ message: booleanValidationMessage })
count?: boolean;
```

### GetSentBandInvitationsQueryDto 변경

동일하게 `count` 필드를 추가한다.

```typescript
@ApiPropertyOptional({ description: '전체 개수 포함 여부. true이면 meta.totalCount에 COUNT 쿼리 결과 포함', default: false })
@Transform(parseOptionalBooleanValue)
@IsOptional()
@IsBoolean({ message: booleanValidationMessage })
count?: boolean;
```

---

## 타입 변경

### ReceivedBandInvitationCursor / GetReceivedBandInvitationsResult

```typescript
export interface GetReceivedBandInvitationsResult {
  items: ReceivedBandInvitationListItem[];
  meta: {
    count: number;
    take: number;
    totalCount: number | null;   // 신규: count=true이면 COUNT 쿼리 결과, 아니면 null
    cursor: ReceivedBandInvitationCursor | null;
    next: string | null;         // 변경: { id: string } | null → string | null
  };
}
```

### SentBandInvitationCursor / GetSentBandInvitationsResult

```typescript
export interface GetSentBandInvitationsResult {
  items: SentBandInvitationListItem[];
  meta: {
    count: number;
    take: number;
    totalCount: number | null;   // 신규
    cursor: SentBandInvitationCursor | null;
    next: string | null;         // 변경: { id: string } | null → string | null
  };
}
```

---

## Repository 인터페이스 변경

`bands.repository.ts`의 인터페이스 시그니처는 **변경하지 않는다.** 반환 타입이 `GetReceivedBandInvitationsResult` / `GetSentBandInvitationsResult`를 그대로 참조하므로, 해당 타입에 `totalCount`와 `next: string | null`을 추가하면 인터페이스도 함께 변경된다.

---

## Repository 구현 변경 (bands.prisma-repository.ts)

### findReceivedBandInvitations

변경 내용:
1. `count` 조건부 COUNT 쿼리 추가: `query.count === true`이면 `client.bandInvitation.count(where)` 실행, 아니면 `null`
2. `next` 계산: `{ id: ... }` 객체 대신 `this.buildNextReceivedUrl(query, lastItem.invitationId)` 반환
3. 반환 `meta`에 `totalCount` 추가

### buildNextReceivedUrl / buildNextSentUrl

`buildNextPath` 유틸(`src/common/url/url.util.ts`)을 사용해 다음 페이지 URL을 생성한다.

---

## Service 비즈니스 규칙

`getReceivedBandInvitations`, `getSentBandInvitations`는 Repository에 단순 위임이므로 변경 없음.

`count` 처리는 Repository 레이어에서 담당한다 (Service에서 COUNT 판단 로직 없음).

---

## Controller Swagger 변경

- `bands.controller.ts` createBandInvitation: 400 설명 보강, 403 설명 보강, 409 추가
- `band-invitations.controller.ts` acceptBandInvitation: 409 추가
- `band-invitations.controller.ts` declineBandInvitation: 409 추가

---

## 트랜잭션 경계

두 쿼리(findMany + count)가 동일한 `tx?` client를 사용. `$transaction`을 새로 열지 않는다.

---

## 테스트 계획

| 메서드 | 케이스 | 결과 |
|--------|--------|------|
| findReceivedBandInvitations | happy path | ✅ |
| findReceivedBandInvitations | next 있음 (URL string) | ✅ |
| findReceivedBandInvitations | count=true → totalCount | ✅ |
| findReceivedBandInvitations | count=false → totalCount null | ✅ |
| findSentBandInvitations | happy path | ✅ |
| findSentBandInvitations | next 있음 (URL string) | ✅ |
| findSentBandInvitations | count=true → totalCount | ✅ |
| findSentBandInvitations | count=false → totalCount null | ✅ |
