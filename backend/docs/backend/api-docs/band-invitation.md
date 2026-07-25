# band-invitation API

> 최종 동기화: 2026-07-02
>
> ⚠️ 변환 노트:
> - Notion 원본 응답 형식이 `{ status, error, message, data }` 또는 `{ data, success }` 혼재하나, 하네스 컨벤션(`ApiSuccessResponse<T>`)에 맞게 `{ data, success }` 형식으로 통일.
> - #14: Notion properties의 `body: false`와 달리 req 섹션에 body 필드가 명시되어 있어 body 있음으로 처리.
> - #14: `자기 자신에게 초대 불가` 400 에러 조건 추가 (Notion 원본 명시).
> - [설계자 보완 2026-06-26] 인증 여부 → "필요 (JWT Bearer)"로 수정; #14 권한 명시, 409 에러 코드 추가; #15/#16 409 에러 코드 추가; `count` 쿼리 파라미터를 boolean 타입으로 보완; `message` 필드 optional 명시; `next` 타입을 `string | null`로 수정; `meta.totalCount` 필드 추가.

---

## #14 POST /bands/{bandId}/invitations

**설명:** 밴드 리더/관리자가 특정 유저를 밴드에 초대한다.
**인증:** 필요 (JWT Bearer)
**권한:** BM 또는 ADMIN 역할 필요

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 초대를 보낼 밴드 ID |

**Body**

```json
{
  "inviteeUserId": "uuid",
  "message": "같이 밴드 하실래요?"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| inviteeUserId | string (UUID) | ✅ | 초대 대상 사용자 ID |
| message | string | ❌ | 초대 메시지 (최대 500자) |

### Response 200

```json
{
  "data": {
    "invitationId": "uuid",
    "bandId": "uuid",
    "inviterUserId": "uuid",
    "inviteeUserId": "uuid",
    "status": "PENDING",
    "createdAt": "2026-04-10T12:00:00Z"
  },
  "success": true
}
```

### Error

| 코드 | 조건 |
|------|------|
| 400 | 잘못된 입력 / 자기 자신에게 초대 불가 |
| 401 | 인증 실패 (JWT 없음 또는 만료) |
| 403 | 권한 없음 (BM/ADMIN 아님) / 차단된 사용자 초대 불가 |
| 404 | 밴드 또는 초대 대상 유저 없음 |
| 409 | 이미 밴드 멤버 / 이미 초대가 존재함 |

---

## #15 POST /invitations/{inviteId}/accept

**설명:** 초대를 받은 유저가 초대를 수락한다. 본인이 받은 초대만 수락 가능.
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| inviteId | string (UUID) | ✅ | 수락할 초대 ID |

### Response 200

```json
{
  "data": {
    "invitationId": "uuid",
    "bandId": "uuid",
    "userId": "uuid",
    "invitationStatus": "ACCEPTED",
    "joinedAt": "2026-04-30T10:00:00.000Z"
  },
  "success": true
}
```

### Error

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 (JWT 없음 또는 만료) |
| 403 | 권한 없음 (본인 초대가 아님) |
| 404 | 초대 없음 |
| 409 | 이미 처리된 초대 (PENDING 상태가 아님) / 이미 밴드 멤버 |

---

## #16 POST /invitations/{inviteId}/decline

**설명:** 초대를 받은 유저가 초대를 거절한다. 본인이 받은 초대만 거절 가능.
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| inviteId | string (UUID) | ✅ | 거절할 초대 ID |

### Response 200

```json
{
  "data": {
    "invitationId": "uuid",
    "bandId": "uuid",
    "userId": "uuid",
    "invitationStatus": "DECLINED",
    "respondedAt": "2026-04-30T10:00:00.000Z"
  },
  "success": true
}
```

### Error

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 (JWT 없음 또는 만료) |
| 403 | 권한 없음 (본인 초대가 아님) |
| 404 | 초대 없음 |
| 409 | 이미 처리된 초대 (PENDING 상태가 아님) |

---

## #17 DELETE /invitations/{inviteId}

**설명:** 초대를 보낸 사람이 초대를 취소한다. 본인이 보낸 PENDING 상태 초대만 취소 가능.
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| inviteId | string (UUID) | ✅ | 취소할 초대 ID |

### Response 200

```json
{
  "data": {
    "invitationId": "uuid",
    "invitationStatus": "CANCELED"
  },
  "success": true
}
```

### Error

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 (JWT 없음 또는 만료) |
| 403 | 권한 없음 (본인이 보낸 초대가 아님) |
| 404 | 초대 없음 |

---

## #18 GET /invitations/received

**설명:** 내가 받은 초대 목록을 커서 기반 페이지네이션으로 조회한다.
**인증:** 필요 (JWT Bearer)

### Request

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| count | boolean | ❌ | false | true이면 meta.totalCount에 전체 개수 포함 |
| take | number | ❌ | 20 | 페이지당 항목 수 |
| order__created_at | string | ❌ | desc | 생성일 정렬 방향 (`asc` / `desc`) |
| order__id | string | ❌ | desc | ID 정렬 방향 (`asc` / `desc`) |
| cursor__id | string (UUID) | ❌ | — | 커서 ID (다음 페이지 조회 시 사용) |
| where__invitation_status | string | ❌ | PENDING | 초대 상태 필터 (`PENDING` / `ACCEPTED` / `DECLINED` / `EXPIRED`) |

### Response 200

```json
{
  "data": {
    "items": [
      {
        "invitationId": "uuid",
        "band": {
          "bandId": "uuid",
          "name": "Rocking Stars",
          "description": "직장인 밴드"
        },
        "inviter": {
          "userId": "uuid",
          "nickname": "Jun"
        },
        "message": "같이 밴드 하실래요?",
        "invitationStatus": "PENDING",
        "createdAt": "2026-04-30T10:00:00.000Z"
      }
    ],
    "meta": {
      "count": 1,
      "take": 20,
      "totalCount": 42,
      "cursor": { "id": "uuid" },
      "next": "/invitations/received?where__invitation_status=PENDING&order__created_at=desc&order__id=desc&take=20&cursor__id=uuid"
    }
  },
  "success": true
}
```

> `meta.totalCount`: `count=true`이면 전체 건수(COUNT 쿼리), `count=false` 또는 미전달이면 `null`.
> `meta.next`: 다음 페이지가 없으면 `null`.

### Error

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 (JWT 없음 또는 만료) |

---

## #19 GET /invitations/sent

**설명:** 내가 보낸 초대 목록을 커서 기반 페이지네이션으로 조회한다.
**인증:** 필요 (JWT Bearer)

### Request

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| count | boolean | ❌ | false | true이면 meta.totalCount에 전체 개수 포함 |
| take | number | ❌ | 20 | 페이지당 항목 수 |
| order__created_at | string | ❌ | desc | 생성일 정렬 방향 (`asc` / `desc`) |
| order__id | string | ❌ | desc | ID 정렬 방향 (`asc` / `desc`) |
| cursor__id | string (UUID) | ❌ | — | 커서 ID (다음 페이지 조회 시 사용) |
| where__invitation_status | string | ❌ | PENDING | 초대 상태 필터 (`PENDING` / `ACCEPTED` / `DECLINED` / `EXPIRED`) |

### Response 200

```json
{
  "data": {
    "items": [
      {
        "invitationId": "b8f1c3d2-...",
        "band": {
          "bandId": "a1b2c3d4-...",
          "name": "Rocking Stars",
          "description": "직장인 밴드",
          "memberCount": 5
        },
        "invitee": {
          "userId": "u123...",
          "nickname": "Choi",
          "avatarUrl": "https://..."
        },
        "invitationStatus": "PENDING",
        "message": "같이 합주해요!",
        "createdAt": "2026-04-30T10:00:00.000Z",
        "respondedAt": null
      }
    ],
    "meta": {
      "count": 1,
      "take": 20,
      "totalCount": null,
      "cursor": { "id": "b8f1c3d2-..." },
      "next": null
    }
  },
  "success": true
}
```

> `meta.totalCount`: `count=true`이면 전체 건수(COUNT 쿼리), `count=false` 또는 미전달이면 `null`.
> `meta.next`: 다음 페이지가 없으면 `null`.

### Error

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 (JWT 없음 또는 만료) |

---

## #20 GET /invitations/{invitationId}

**설명:** 초대받은 사용자가 자신의 밴드 초대를 단건으로 조회한다.
**인증:** 필요 (JWT Bearer)
**권한:** 초대받은 사용자 본인만 조회 가능

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| invitationId | string (UUID) | ✅ | 초대 ID |

### Response 200

```json
{
  "data": {
    "invitationId": "uuid",
    "band": {
      "bandId": "uuid",
      "name": "Rocking Stars",
      "description": "직장인 밴드"
    },
    "inviter": {
      "userId": "uuid",
      "nickname": "Jun"
    },
    "message": "같이 밴드 하실래요?",
    "invitationStatus": "PENDING",
    "createdAt": "2026-04-30T10:00:00.000Z"
  },
  "success": true
}
```

### Error

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 (JWT 없음 또는 만료) |
| 403 | 권한 없음 (본인이 받은 초대가 아님) |
| 404 | 초대 없음 |
