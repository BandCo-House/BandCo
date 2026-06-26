# band-invitation API

> 최종 동기화: 2026-06-26
>
> ⚠️ 변환 노트:
> - Notion 원본 응답 형식이 `{ status, error, message, data }` 구조이나, 프로젝트 컨벤션(`ApiSuccessResponse<T>`)에 맞게 `{ data, success }` 형식으로 표기함.
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
| message | string | ❌ | 초대 메시지 (optional) |

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

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | 잘못된 입력 |
| 401 | 인증 실패 |
| 403 | 권한 없음 (BM 또는 ADMIN 아님) |
| 404 | 밴드 또는 대상 유저 없음 |
| 409 | 이미 밴드 멤버인 사용자 / 이미 초대가 존재함 / 차단된 사용자 |

---

## #15 POST /invitations/{inviteId}/accept

**설명:** 초대를 받은 유저가 초대를 수락한다.
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

### Error Responses

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |
| 403 | 권한 없음 (본인 초대가 아님) |
| 404 | 초대 없음 |
| 409 | 이미 처리된 초대 (PENDING 상태가 아님) |

---

## #16 POST /invitations/{inviteId}/decline

**설명:** 초대를 받은 유저가 초대를 거절한다.
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

### Error Responses

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |
| 403 | 권한 없음 (본인 초대가 아님) |
| 404 | 초대 없음 |
| 409 | 이미 처리된 초대 (PENDING 상태가 아님) |

---

## #17 DELETE /invitations/{inviteId}

**설명:** 초대를 보낸 사람이 초대를 취소한다.
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

### Error Responses

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |
| 403 | 권한 없음 (본인이 보낸 초대가 아님) |
| 404 | 초대 없음 |

---

## #18 GET /invitations/received

**설명:** 내가 받은 초대 목록을 조회한다. (Notion 원본 경로: `/invitations/recevied` — 오타)
**인증:** 필요 (JWT Bearer)

### Request

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| count | boolean | ❌ | false | true이면 meta.totalCount에 전체 개수 포함 |
| take | number | ❌ | 20 | 페이지당 항목 수 |
| order__created_at | string | ❌ | desc | createdAt 정렬 방향 |
| order__id | string | ❌ | desc | id 정렬 방향 |
| cursor__id | string (UUID) | ❌ | - | 커서 ID |
| where__invitation_status | string | ❌ | PENDING | 초대 상태 필터 |

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
      "count": 10,
      "take": 20,
      "totalCount": 42,
      "cursor": {
        "id": "uuid"
      },
      "next": "/invitations/received?take=20&cursor__id=uuid&order__created_at=desc&order__id=desc"
    }
  },
  "success": true
}
```

> `meta.totalCount`: `count=true`이면 전체 개수(COUNT 쿼리 결과), `count=false` 또는 미전달이면 `null`.

### Error Responses

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |

---

## #19 GET /invitations/sent

**설명:** 내가 보낸 초대 목록을 조회한다.
**인증:** 필요 (JWT Bearer)

### Request

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| count | boolean | ❌ | false | true이면 meta.totalCount에 전체 개수 포함 |
| take | number | ❌ | 20 | 페이지당 항목 수 |
| order__created_at | string | ❌ | desc | createdAt 정렬 방향 |
| order__id | string | ❌ | desc | id 정렬 방향 |
| cursor__id | string (UUID) | ❌ | - | 커서 ID |
| where__invitation_status | string | ❌ | PENDING | 초대 상태 필터 |

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
      "count": 2,
      "take": 20,
      "totalCount": null,
      "cursor": {
        "id": "c9d2e4f5-..."
      },
      "next": null
    }
  },
  "success": true
}
```

> `meta.totalCount`: `count=true`이면 전체 개수(COUNT 쿼리 결과), `count=false` 또는 미전달이면 `null`.

### Error Responses

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |
