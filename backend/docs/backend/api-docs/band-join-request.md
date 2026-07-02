# band-join-request API

> 최종 동기화: 2026-07-02
>
> ⚠️ 변환 노트:
> - Notion 원본 응답 형식이 `{ status, error, message, data }` 구조이나, 하네스 컨벤션(`ApiSuccessResponse<T>`)에 맞게 `{ data, success }` 형식으로 변환.
> - #20: Notion properties에 `body: false`, `header: false`로 표기되어 있으나, req 섹션에 `message` body 필드가 명시되어 있어 body 있음으로 처리.
> - #20, #21, #22(조회): 에러 코드 미명시 — 사용자 확인 필요.
> - #22(승인), #23: 인증 여부 Notion 원본 미명시 (header: false) — BM/ADMIN 권한 필요할 것으로 추정되나 사용자 확인 필요.

---

## #20 POST /bands/{bandId}/join-requests

**설명:** 유저가 특정 밴드에 가입을 요청한다.
**인증:** 불필요 (Notion 원본 `header: false`) — 사용자 확인 필요

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 가입 요청할 밴드 ID |

**Body**

```json
{
  "message": "기타로 합류하고 싶습니다!"
}
```

### Response 200

```json
{
  "data": {
    "joinRequestId": "uuid",
    "bandId": "uuid",
    "userId": "uuid",
    "joinRequestStatus": "PENDING",
    "createdAt": "2026-04-30T10:00:00.000Z"
  },
  "success": true
}
```

### Error

> Notion 원본 에러 코드 미명시 — 사용자 확인 필요.

---

## #21 GET /join-requests/sent

**설명:** 내가 보낸 밴드 가입 요청 목록을 조회한다.
**인증:** 불필요 (Notion 원본 `header: false`) — 사용자 확인 필요

### Request

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| count | string | ❌ | — | 전체 개수 포함 여부 |
| take | number | ❌ | 20 | 페이지당 항목 수 |
| order__created_at | string | ❌ | desc | 생성일 정렬 방향 |
| order__id | string | ❌ | desc | ID 정렬 방향 |

### Response 200

```json
{
  "data": {
    "items": [
      {
        "joinRequestId": "8a8a8a8a-1111-2222-3333-444444444444",
        "band": {
          "bandId": "a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1",
          "name": "Rocking Stars",
          "description": "주 1회 합주 밴드",
          "visibility": true
        },
        "message": "기타로 참여하고 싶습니다.",
        "joinRequestStatus": "PENDING",
        "createdAt": "2026-04-10T12:00:00Z",
        "respondedAt": null
      },
      {
        "joinRequestId": "9b9b9b9b-1111-2222-3333-555555555555",
        "band": {
          "bandId": "c9d7e8f1-aaaa-bbbb-cccc-dddddddddddd",
          "name": "Indie Wave",
          "description": null,
          "visibility": true
        },
        "message": "보컬 지원합니다.",
        "joinRequestStatus": "REJECTED",
        "createdAt": "2026-04-09T18:00:00Z",
        "respondedAt": "2026-04-09T20:00:00Z"
      }
    ],
    "meta": {
      "count": 2,
      "take": 20,
      "cursor": {
        "createdAt": "2026-04-09T18:00:00Z",
        "id": "9b9b9b9b-1111-2222-3333-555555555555"
      },
      "next": null
    }
  },
  "success": true
}
```

### Error

> Notion 원본 에러 코드 미명시 — 사용자 확인 필요.

---

## #22 GET /bands/{bandId}/join-requests

**설명:** 밴드에 요청 온 모든 가입 요청 목록을 조회한다.
**인증:** 불필요 (Notion 원본 `header: false`) — 사용자 확인 필요

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 조회할 밴드 ID |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| count | string | ❌ | — | 전체 개수 포함 여부 |
| take | number | ❌ | 20 | 페이지당 항목 수 |
| order__created_at | string | ❌ | desc | 생성일 정렬 방향 |
| order__id | string | ❌ | desc | ID 정렬 방향 |

### Response 200

```json
{
  "data": {
    "items": [
      {
        "joinRequestId": "uuid",
        "requester": {
          "userId": "uuid",
          "nickname": "Jun",
          "avatarUrl": "https://..."
        },
        "message": "보컬로 참여하고 싶습니다.",
        "joinRequestStatus": "PENDING",
        "createdAt": "2026-04-30T10:00:00.000Z"
      }
    ],
    "meta": {
      "count": 1,
      "take": 20,
      "cursor": {
        "createdAt": "2026-04-30T10:00:00.000Z",
        "id": "uuid"
      },
      "next": "/bands/uuid/join-requests?take=20&cursor__created_at=2026-04-30T10:00:00.000Z&cursor__id=uuid"
    }
  },
  "success": true
}
```

### Error

> Notion 원본 에러 코드 미명시 — 사용자 확인 필요.

---

## #22 POST /join-requests/{joinRequestId}/approve

> ⚠️ Notion 원본에 #22 번호가 중복 사용됨 (GET /bands/{bandId}/join-requests와 동일 번호).

**설명:** 밴드 관리자가 가입 요청을 승인한다.
**인증:** 불필요 (Notion 원본 `header: false`) — BM/ADMIN 권한 필요 여부 사용자 확인 필요

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| joinRequestId | string (UUID) | ✅ | 승인할 가입 요청 ID |

### Response 200

```json
{
  "data": {
    "joinRequestId": "uuid",
    "bandId": "uuid",
    "userId": "uuid",
    "joinRequestStatus": "APPROVED",
    "joinedAt": "2026-04-30T10:00:00.000Z"
  },
  "success": true
}
```

### Error

> Notion 원본 에러 코드 미명시 — 사용자 확인 필요.

---

## #23 POST /join-requests/{joinRequestId}/reject

**설명:** 밴드 관리자가 가입 요청을 거절한다.
**인증:** 불필요 (Notion 원본 `header: false`) — BM/ADMIN 권한 필요 여부 사용자 확인 필요

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| joinRequestId | string (UUID) | ✅ | 거절할 가입 요청 ID |

### Response 200

```json
{
  "data": {
    "joinRequestId": "uuid",
    "bandId": "uuid",
    "userId": "uuid",
    "joinRequestStatus": "REJECTED",
    "respondedAt": "2026-04-30T10:00:00.000Z"
  },
  "success": true
}
```

### Error

> Notion 원본 에러 코드 미명시 — 사용자 확인 필요.
