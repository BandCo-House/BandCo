# Band API

> 최종 동기화: 2026-07-02
>
> ⚠️ 변환 노트:
> - Notion 원본의 응답 형식은 `{ "status": "success", "error": null, "message": "...", "data": { ... } }` 구조이나, 하네스 컨벤션인 `{ "data": ..., "success": true }` 형태로 변환하였다.
> - #12 밴드 검색하기: Notion 원본에서 `req` 블록에 응답 JSON이 기재되어 있어, 실제 응답으로 간주하여 변환하였다. 요청 바디는 없음(Query Parameter로 처리). 검색 파라미터 이름은 Notion 원본 예시 URL 기준 `where__name__contains`로 수정.
> - [설계자 보완 2026-06-26] #8 DELETE /bands/{bandId}: 코드(`bands.controller.ts`)에 `@UseGuards(AccessTokenGuard)` 데코레이터 확인 → 인증 필요로 확정.
> - [설계자 보완 2026-06-26] #12 GET /bands/search: 코드(`bands.controller.ts`)에 Guards 없음 → 비인증 공개 확정.
> - [설계자 보완 2026-06-26] #13 PATCH /bands/{bandId}: 코드(`bands.controller.ts`)에 `@UseGuards(AccessTokenGuard)` 확인 → 인증 필요 확정. Body 필드(name, description, visibility, coverImgUrl) 모두 선택이며 하나라도 입력해야 함(코드 `validateUpdateBandInput` 기준). `bmId` 필드는 MVP에서 지원하지 않으므로 명세에서 제거.
> - [설계자 보완 2026-06-26] #10, #11, #12 응답 `meta.next`: 현재 코드는 커서 객체(`{ createdAt, id }` 등)를 반환하나, User 모듈 패턴(`buildNextPath`) 적용 후 `string | null`(URL 경로)로 변환 예정.
> - [코드 기반 보완 2026-06-26] 에러 코드 전체 갱신: 서비스/컨트롤러 코드 기준으로 실제 throw 조건 명시. #11 인증 요구사항 수정(컨트롤러 Guard 없음 → 공개 API).
> - [코드 기반 보완 2026-06-26] `Error Responses` → `Error`, 헤더 `조건` → `사유`로 User API 형식 통일.
> - [설계자 보완 2026-07-02] #70 GET /bands/{bandId}: Notion 원본에 없는 신규 API. 전체 api-docs 최대 번호 #69 기준으로 #70 부여.
> - [코드 기반 보완 2026-07-05] #52 DELETE /bands/{bandId}/me: 코드에는 구현되어 있으나 로컬 문서에 누락되어 추가. Notion 원본 페이지는 내용 없는 빈 스텁.

---

## #7 POST /bands

**설명:** 밴드를 생성한다. 이름, 설명, 공개 여부 3가지만 전달하면 생성 가능하며, 초대 대상 유저를 함께 전달할 수 있다.
**인증:** 필요 (JWT Bearer)

### Request

**Body**

```json
{
  "name": "합주하자",
  "description": "주 1회 합주하는 밴드입니다.",
  "visibility": true,
  "genreIds": [
    "0f0a4e3a-8a0c-4f6e-9d2d-9c1a8c6b7b1a",
    "3f2a4e3a-8a0c-4f6e-9d2d-9c1a8c6b7b2b"
  ],
  "coverImgUrl": "https://cdn.example.com/bands/cover.png",
  "inviteeUserIds": [
    "7a1f4e3a-8a0c-4f6e-9d2d-9c1a8c6b7c3d",
    "9b2f4e3a-8a0c-4f6e-9d2d-9c1a8c6b7d4e"
  ]
}
```

### Response 200

```json
{
  "data": {
    "band": {
      "id": "a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1",
      "name": "합주하자",
      "description": "주 1회 합주하는 밴드입니다.",
      "visibility": true,
      "coverImgUrl": "https://cdn.example.com/bands/cover.png",
      "genres": [
        { "id": "0f0a4e3a-8a0c-4f6e-9d2d-9c1a8c6b7b1a", "name": "rock" },
        { "id": "3f2a4e3a-8a0c-4f6e-9d2d-9c1a8c6b7b2b", "name": "jazz" }
      ],
      "bandMasterUserId": "11111111-1111-1111-1111-111111111111",
      "createdAt": "2026-03-03T18:20:10.123Z",
      "invitations": {
        "success": [
          {
            "userId": "7a1f4e3a-8a0c-4f6e-9d2d-9c1a8c6b7c3d",
            "invitationId": "4c2f4e3a-8a0c-4f6e-9d2d-9c1a8c6b7e5f"
          }
        ],
        "failed": [
          {
            "userId": "9b2f4e3a-8a0c-4f6e-9d2d-9c1a8c6b7d4e",
            "reason": "존재하지 않는 사용자입니다."
          }
        ]
      }
    }
  },
  "success": true
}
```

> 초대한 사람은 성공한 목록과 실패한 목록으로 구분하여 반환한다.

### Error

| 코드 | 사유 |
|------|------|
| 400 | 필수 필드(name, visibility) 누락, 중복 장르 ID, 존재하지 않는 장르, 중복 초대 대상 ID |
| 401 | 인증 실패 |

---

## #8 DELETE /bands/{bandId}

**설명:** 밴드를 삭제한다. 밴드 삭제 정책은 추후 고려 예정.
**인증:** 필요 (JWT Bearer) — 코드 기반 확정

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 삭제할 밴드 ID |

### Response 200

```json
{
  "data": {
    "bandId": "uuid",
    "deletedAt": "2026-03-03T09:35:20.123Z"
  },
  "success": true
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `bandId`가 UUID 형식이 아님 |
| 401 | 인증 실패 |
| 403 | 권한 없음 (밴드 마스터 아님) |
| 404 | 밴드 없음 |

---

## #9 PATCH /bands/{bandId}/users/{userId}

**설명:** 밴드 멤버의 역할(권한)을 변경한다. 요청자가 밴드 리더(BM)인지 확인이 필요하다. MVP에서는 ADMIN ↔ MEMBER 전환만 가능하며, BM 부여는 제공하지 않는다.
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 밴드 ID |
| userId | string (UUID) | ✅ | 역할을 변경할 멤버의 유저 ID |

**Body**

```json
{
  "role": "ADMIN"
}
```

> **ENUM `role`:** `BM` (Band Master / 리더), `ADMIN` (부리더), `MEMBER` (일반 멤버)
> MVP에서는 `ADMIN` ↔ `MEMBER` 전환만 가능.

### Response 200

```json
{
  "data": {
    "member": {
      "userId": "b6d0f0b1-7c7d-4e23-9c7b-0c0d9f6a2a21",
      "role": "ADMIN"
    }
  },
  "success": true
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `bandId`/`userId` UUID 형식 오류, `role`이 `BM`이거나 대상이 밴드장인 경우 |
| 401 | 인증 실패 |
| 403 | 요청자가 밴드 마스터 아님 |
| 404 | 밴드 없음 또는 대상 멤버 없음 |

---

## #10 GET /bands/me

**설명:** 인증된 유저가 속한 밴드 목록을 커서 기반 페이지네이션으로 조회한다.
**인증:** 필요 (JWT Bearer)

### Request

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| take | number | 선택 | 20 | 가져올 밴드 개수 |
| cursor__created_at | string | 선택 | — | 커서: 생성일 |
| cursor__id | string | 선택 | — | 커서: 밴드 ID |

> 커서 값은 응답의 `meta.next`에 포함된 URL을 그대로 사용한다. `next`가 `null`이면 다음 페이지 없음.

### Response 200

```json
{
  "data": {
    "items": [
      {
        "id": "a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1",
        "name": "합주하자",
        "description": "주 1회 합주",
        "visibility": true,
        "myRole": "BM",
        "joinedAt": "2026-03-01T12:10:00.000+09:00",
        "createdAt": "2026-03-01T12:00:00.000+09:00",
        "memberCount": 20
      },
      {
        "id": "e2f9a1c1-3d4b-4f2a-9d1f-8a7c1f2d3e4a",
        "name": "락스타",
        "description": "im mother fukking rock star shit!",
        "visibility": true,
        "myRole": "MEMBER",
        "joinedAt": "2026-02-20T18:30:00.000+09:00",
        "createdAt": "2026-02-10T09:00:00.000+09:00",
        "memberCount": 35
      }
    ],
    "meta": {
      "count": 2,
      "take": 20,
      "cursor": {
        "createdAt": "2026-02-10T09:00:00.000+09:00",
        "id": "e2f9a1c1-3d4b-4f2a-9d1f-8a7c1f2d3e4a"
      },
      "next": "/bands/me?cursor__created_at=2026-02-10T09%3A00%3A00.000%2B09%3A00&cursor__id=e2f9a1c1-3d4b-4f2a-9d1f-8a7c1f2d3e4a&take=20"
    }
  },
  "success": true
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `take` 유효성 오류, `cursor__created_at`/`cursor__id` 쌍 불일치, `cursor__created_at` 날짜 형식 오류 |
| 401 | 인증 실패 |

---

## #11 GET /bands/{bandId}/users

**설명:** 밴드에 속한 모든 멤버를 커서 기반 페이지네이션으로 조회한다. 멤버별 세션(악기) 정보와 프로필 이미지를 포함한다. MVP에서는 가입 전 미리보기를 위해 공개 조회 허용.
**인증:** 불필요 (공개) — 컨트롤러 Guard 없음 확인

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 밴드 ID |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| take | number | 선택 | 20 | 가져올 멤버 수 |
| order__joined_at | string | 선택 | `desc` | 가입일 정렬 방향 (`asc` / `desc`) |
| order__id | string | 선택 | `desc` | ID 정렬 방향 (`asc` / `desc`) |
| cursor__joined_at | string | 선택 | — | 커서: 가입일 |
| cursor__id | string | 선택 | — | 커서: 멤버 ID |

### Response 200

```json
{
  "data": {
    "bandId": "a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1",
    "members": [
      {
        "bandMemberId": "uuid",
        "userId": "uuid",
        "nickname": "Jun",
        "avatarUrl": "https://...",
        "role": "ADMIN",
        "joinedAt": "2026-04-10T00:00:00.000Z",
        "skills": [
          {
            "skillTypeId": "uuid",
            "skillName": "Guitar",
            "skillLevel": "ADVANCED",
            "isPrimary": true
          }
        ]
      },
      {
        "bandMemberId": "uuid",
        "userId": "uuid",
        "nickname": "Choi",
        "avatarUrl": null,
        "role": "MEMBER",
        "joinedAt": "2026-04-09T00:00:00.000Z",
        "skills": []
      }
    ],
    "meta": {
      "count": 2,
      "take": 20,
      "cursor": {
        "joinedAt": "2026-04-10T00:00:00.000Z",
        "id": "band-member-uuid"
      },
      "next": "/bands/a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1/users?cursor__joined_at=2026-04-09T00%3A00%3A00.000Z&cursor__id=band-member-uuid&take=20"
    }
  },
  "success": true
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `bandId` UUID 형식 오류, `order__joined_at`/`order__id` 정렬 방향 불일치, `cursor__joined_at`/`cursor__id` 쌍 불일치, `cursor__joined_at` 날짜 형식 오류 |
| 404 | 밴드 없음 |

---

## #12 GET /bands/search

**설명:** 밴드 이름으로 밴드를 검색한다. 커서 기반 페이지네이션.
**인증:** 불필요

### Request

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| where__name__contains | string | 선택 | — | 밴드 이름 검색 키워드 |
| take | number | 선택 | 20 | 가져올 밴드 수 |
| order__created_at | string | 선택 | `desc` | 생성일 정렬 방향 (`asc` / `desc`) |
| order__id | string | 선택 | `desc` | ID 정렬 방향 (`asc` / `desc`) |
| cursor__created_at | string | 선택 | — | 커서: 생성일 |
| cursor__id | string | 선택 | — | 커서: 밴드 ID |

> 요청 예시: `GET /bands/search?where__name__contains=rock&take=20`

### Response 200

```json
{
  "data": {
    "keyword": "rock",
    "items": [
      {
        "bandId": "a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1",
        "name": "Rocking Stars",
        "description": "주 1회 합주하는 직장인 밴드",
        "visibility": true,
        "memberCount": 5,
        "bandMaster": {
          "userId": "b6d0f0b1-7c7d-4e23-9c7b-0c0d9f6a2a21",
          "nickname": "Jun"
        },
        "createdAt": "2026-04-10T00:00:00.000Z"
      }
    ],
    "meta": {
      "count": 1,
      "take": 20,
      "cursor": {
        "createdAt": "2026-04-10T00:00:00.000Z",
        "id": "a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1"
      },
      "next": "/bands/search?cursor__created_at=2026-04-10T00%3A00%3A00.000Z&cursor__id=a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1&take=20&order__created_at=desc&order__id=desc&where__name__contains=rock"
    }
  },
  "success": true
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `order__created_at`/`order__id` 정렬 방향 불일치, `cursor__created_at`/`cursor__id` 쌍 불일치, `cursor__created_at` 날짜 형식 오류 |

---

## #13 PATCH /bands/{bandId}

**설명:** 밴드 정보를 수정한다. BM 변경은 MVP에서 막아둘 예정.
**인증:** 필요 (JWT Bearer) — 코드 기반 확정

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 수정할 밴드 ID |

**Body**

```json
{
  "name": "합주하자",
  "description": "주 1회 합주하는 밴드입니다.",
  "visibility": true,
  "coverImgUrl": "https://cdn.example.com/bands/cover.png"
}
```

> 모든 필드는 선택이며, 하나라도 입력해야 한다(코드 `validateUpdateBandInput` 기준).
> `bmId`(BM 변경)는 MVP에서 지원하지 않으므로 요청 필드에서 제외한다.

### Response 200

```json
{
  "data": {
    "bandId": "uuid",
    "name": "Rocking Stars",
    "description": "주 2회 합주하는 밴드",
    "visibility": true,
    "updatedAt": "2026-04-10T12:00:00Z"
  },
  "success": true
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | 수정 필드 모두 미전달, `name`이 빈 문자열, `bandId` UUID 형식 오류 |
| 401 | 인증 실패 |
| 403 | 밴드 마스터 아님 |
| 404 | 밴드 없음 |

---

## #52 DELETE /bands/{bandId}/me

**설명:** 인증된 유저가 밴드에서 나간다. 밴드장(BM)은 이 API로 나갈 수 없다.
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 나갈 밴드 ID |

### Response 200

```json
{
  "data": {
    "bandId": "uuid",
    "userId": "uuid"
  },
  "success": true
}
```

### Error

| 코드 | 사유 |
|------|------|
| 401 | 인증 실패 |
| 403 | 밴드 멤버가 아님, 밴드장은 이 API로 나갈 수 없음 |
| 404 | 밴드를 찾을 수 없음 |

---

## #70 GET /bands/{bandId}

**설명:** 밴드 ID로 삭제되지 않은 밴드의 상세 정보를 조회한다.
**인증:** 불필요 (공개 API)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 조회할 밴드 ID |

### Response 200

```json
{
  "data": {
    "band": {
      "id": "a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1",
      "name": "합주하자",
      "description": "주 1회 합주하는 밴드입니다.",
      "visibility": true,
      "coverImgUrl": "https://cdn.example.com/bands/cover.png",
      "bandMasterUserId": "11111111-1111-1111-1111-111111111111",
      "genres": [
        { "id": "0f0a4e3a-8a0c-4f6e-9d2d-9c1a8c6b7b1a", "name": "rock" },
        { "id": "3f2a4e3a-8a0c-4f6e-9d2d-9c1a8c6b7b2b", "name": "jazz" }
      ],
      "memberCount": 5,
      "createdAt": "2026-03-03T18:20:10.123Z"
    }
  },
  "success": true
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `bandId`가 UUID 형식이 아님 |
| 404 | 밴드 없음 (삭제된 밴드 포함) |
