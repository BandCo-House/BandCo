# Place API

> 최종 동기화: 2026-05-29
>
> ⚠️ 변환 노트:
> - Notion 응답 형식이 `{status, error, message, data}` 구조로 기재되어 있으나, 컨벤션상 컨트롤러는 `ApiSuccessResponse<T>` (`{data, success}`) 로 감싸야 한다. 아래 명세는 Notion 원본의 `data` 필드 구조를 그대로 유지하되, 실제 응답은 컨벤션 형식을 따른다.
> - `#39 장소 생성` req 본문에 JSON 문법 오류(`"imageUrl" "hello.jpg"` — 콜론 누락)가 있어 `"imageUrl": "hello.jpg"` 로 보정했다.
> - [설계자 보완 2026-05-29] GET /bands/{bandId}/places 쿼리 파라미터에서 커서 파라미터(`cursor__created_at`, `cursor__id`) 및 `where__is_active` transform 설명 누락 → 스키마·기존 코드 기반으로 보완. 각 엔드포인트 에러 코드 400 추가.

---

## POST /bands/{bandId}/places

**설명:** 밴드에 장소 생성
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 밴드 ID |

**Body**

```json
{
  "name": "연습실 A",
  "address": "서울시 강남구 테헤란로 123",
  "detailAddress": "2층",
  "latitude": 37.5006,
  "longitude": 127.0364,
  "imageUrl": "hello.jpg"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| name | string | ✅ | 장소 이름 (최대 120자) |
| address | string | - | 주소 (최대 255자). 이름만으로 충분한 장소("동방 1호")는 생략한다 |
| detailAddress | string | - | 상세 위치 메모 (최대 255자) |
| latitude | number | - | 위도. 지도 검색으로 고른 위치일 때만 전달한다 |
| longitude | number | - | 경도. `latitude`와 반드시 쌍으로 전달한다 |
| imageUrl | string | - | 커버 이미지 URL |

비고: `latitude`·`longitude`는 한쪽만 보내거나 `address` 없이 보내면 400 오류가 반환된다. 응답의 `address`·`latitude`·`longitude`는 값이 없으면 `null`이다.

### Response 200

```json
{
  "data": {
    "placeId": "uuid",
    "bandId": "uuid",
    "name": "합정 연습실 A",
    "address": "서울 마포구 합정동 123-45",
    "detailAddress": "3층 301호",
    "latitude": 37.5496,
    "longitude": 126.9139,
    "imageUrl": "https://example.com/place.png",
    "isActive": true,
    "createdAt": "2026-04-30T12:00:00Z"
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | 입력 검증 실패, 좌표 쌍 불일치 또는 address 없는 좌표 |
| 401 | 인증 실패 |
| 403 | 밴드 멤버가 아님 |
| 404 | 밴드 없음 |

---

## GET /bands/{bandId}/places

**설명:** 밴드 내 장소 목록 조회 (커서 기반 페이지네이션)
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 밴드 ID |

**Query Parameters**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| order__created_at | string | - | DESC | 생성일 정렬 방향 (`ASC` / `DESC`) |
| order__id | string | - | DESC | ID 정렬 방향 (`ASC` / `DESC`) |
| take | number | - | 20 | 페이지당 항목 수 |
| where__is_active | boolean | - | - | 활성 여부 필터 (`'true'` / `'false'` 문자열로 전달) |
| cursor__created_at | string | - | - | 커서 생성일 (ISO 8601). `cursor__id`와 함께 사용 |
| cursor__id | string (UUID) | - | - | 커서 장소 ID. `cursor__created_at`과 함께 사용 |

비고: `cursor__created_at`과 `cursor__id`는 반드시 쌍으로 전달해야 하며, 하나만 전달하면 400 오류가 반환된다. `order__created_at`과 `order__id`는 같은 방향이어야 하며, 다르면 400 오류가 반환된다.

### Response 200

```json
{
  "data": {
    "bandId": "uuid",
    "items": [
      {
        "placeId": "uuid",
        "name": "합정 연습실 A",
        "address": "서울 마포구 합정동 123-45",
        "detailAddress": "3층 301호",
        "latitude": 37.5496,
        "longitude": 126.9139,
    "latitude": 37.5496,
    "longitude": 126.9139,
        "imageUrl": "https://example.com/place.png",
        "isActive": true,
        "createdAt": "2026-04-30T12:00:00Z",
        "updatedAt": "2026-04-30T12:00:00Z"
      }
    ],
    "meta": {
      "count": 1,
      "take": 20,
      "cursor": {
        "createdAt": "2026-04-30T12:00:00Z",
        "id": "uuid"
      },
      "next": "/bands/{bandId}/places?cursor=...&take=20&order__created_at=DESC"
    }
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | 커서 파라미터 쌍 불일치 또는 order 방향 불일치 |
| 401 | 인증 실패 |
| 403 | 밴드 멤버가 아님 |
| 404 | 밴드 없음 |

---

## GET /places/{placeId}

**설명:** 장소 상세 조회
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| placeId | string (UUID) | ✅ | 장소 ID |

**Query Parameters**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| where__is_active | boolean | - | - | 활성 여부 필터 (`'true'` / `'false'` 문자열로 전달) |

### Response 200

```json
{
  "data": {
    "placeId": "uuid",
    "bandId": "uuid",
    "name": "합정 연습실 A",
    "address": "서울 마포구 합정동 123-45",
    "detailAddress": "3층 301호",
    "latitude": 37.5496,
    "longitude": 126.9139,
    "imageUrl": "https://example.com/place.png",
    "isActive": true,
    "createdAt": "2026-04-30T12:00:00Z",
    "updatedAt": "2026-04-30T12:00:00Z"
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |
| 403 | 접근 권한 없음 |
| 404 | 장소 없음 |

---

## PATCH /places/{placeId}

**설명:** 장소 수정
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| placeId | string (UUID) | ✅ | 장소 ID |

**Body**

```json
{
  "name": "합정 연습실 B",
  "address": "서울 마포구 합정동 123-45",
  "detailAddress": "4층 401호",
  "latitude": 37.5496,
  "longitude": 126.9139,
  "imageUrl": "https://example.com/place-new.png"
}
```

비고: `address`·`detailAddress`·`imageUrl`은 `null`(또는 빈 문자열)을 보내면 값을 지운다. 필드를 아예 보내지 않으면 기존 값을 유지한다. `name`은 지울 수 없다.

비고: `address`를 수정하면 이전 좌표는 더 이상 맞지 않으므로, `latitude`·`longitude`를 함께 보내지 않으면 좌표가 `null`로 비워진다. 좌표만 단독으로 수정할 수는 없다.

### Response 200

```json
{
  "data": {
    "placeId": "uuid",
    "bandId": "uuid",
    "name": "합정 연습실 B",
    "address": "서울 마포구 합정동 123-45",
    "detailAddress": "4층 401호",
    "latitude": 37.5496,
    "longitude": 126.9139,
    "imageUrl": "https://example.com/place-new.png",
    "isActive": true,
    "updatedAt": "2026-04-30T12:00:00Z"
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | 수정할 필드가 없음 (name, address, detailAddress, imageUrl 중 하나 이상 필요), 좌표 쌍 불일치 또는 address 없는 좌표 |
| 401 | 인증 실패 |
| 403 | 수정 권한 없음 (밴드 멤버 아님) |
| 404 | 장소 없음 |

---

## DELETE /places/{placeId}

**설명:** 장소 삭제 (소프트 삭제 — `isActive: false` 처리)
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| placeId | string (UUID) | ✅ | 장소 ID |

### Response 200

```json
{
  "data": {
    "placeId": "uuid",
    "bandId": "uuid",
    "isActive": false
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |
| 403 | 삭제 권한 없음 (밴드 멤버 아님 또는 BM/ADMIN 아님) |
| 404 | 장소 없음 |
