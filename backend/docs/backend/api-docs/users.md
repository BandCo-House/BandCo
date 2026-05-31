# users API

> 최종 동기화: 2026-05-31 | Notion: https://www.notion.so/ab542fc9fb31839fbdd60168c20bcd41
>
> ⚠️ 변환 노트: Notion 원본 응답 형식은 `{ "status": "success", "error": null, "message": "...", "data": {...} }` 구조이나, 프로젝트 컨벤션인 `{ "data": ..., "success": true }` 형식으로 변환함. 실제 서버 응답은 Notion 원본 형식을 따름.
>
> ⚠️ 설계자 보완 [2026-05-31]: (1) `GET /profile-music/search` 경로를 `GET /users/profile-music/search`로 수정 (users 컨트롤러 prefix 반영). (2) `PATCH /users/profiles` 명세 경로를 `PATCH /users/:userId/profiles`로 수정 (실제 컨트롤러 구현 기준). (3) 프로필 음악 검색 응답 `items` 배열 래핑 추가.

---

## POST /auth/register/email

**설명:** 이메일과 비밀번호로 회원가입
**인증:** 불필요

### Request

**Body**

```json
{
  "email": "dejunsday@gmail.com",
  "password": "p@assw@rd"
}
```

### Response 200

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400  | 잘못된 입력 (이메일 형식 오류, 비밀번호 조건 미충족 등) |
| 409  | 이미 가입된 이메일 |

---

## POST /auth/login/email

**설명:** 이메일/비밀번호 기반 로그인 (Basic 인증)
**인증:** 불필요 (Authorization 헤더 사용)

### Request

**Headers**

| 헤더 | 형식 | 필수 | 설명 |
|------|------|:----:|------|
| Authorization | `Basic {base64}` | ✅ | `email:password`를 Base64 인코딩한 값 (공백 없이). 예: `Basic ZGV2anVuc2RheUBnbWFpbC5jb206cEBzc3dAcmQ=` |

### Response 200

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400  | Authorization 헤더 누락 또는 형식 오류 |
| 401  | 이메일 또는 비밀번호 불일치 |

---

## GET /users/{userId}/profiles

**설명:** 특정 유저의 프로필 조회 (유저 정보 + 프로필 + 스킬 + 좋아하는 장르)
**인증:** 불필요

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| userId | string (UUID) | ✅ | 조회할 유저의 ID |

### Response 200

```json
{
  "data": {
    "user": {
      "id": "b6d0f0b1-7c7d-4e23-9c7b-0c0d9f6a2a21",
      "email": "devjunsday@gmail.com",
      "status": "ACTIVE",
      "createdAt": "2026-03-01T10:15:22.123+09:00"
    },
    "profile": {
      "nickname": "devjun",
      "selfDescription": "기타를 좋아합니다 🎸",
      "profileMusic": {
        "externalTrackId": "123456789",
        "sourceType": "DEEZER",
        "title": "Bohemian Rhapsody",
        "artistName": "Queen",
        "albumName": "A Night at the Opera",
        "albumImageUrl": "https://cdn.deezer.com/images/album/cover.jpg",
        "durationMs": 354000,
        "previewUrl": "https://cdn.deezer.com/preview/abc123.mp3",
        "sourceUrl": "https://www.deezer.com/track/123456789"
      },
      "avatarUrl": "https://cdn.domain.com/avatar.png"
    },
    "skills": [
      {
        "skillTypeId": "f1a2b3c4-...",
        "skillName": "GUITAR",
        "level": "ADVANCED",
        "isPrimary": true
      },
      {
        "skillTypeId": "d9e8f7a6-...",
        "skillName": "VOCAL",
        "level": "INTERMEDIATE",
        "isPrimary": false
      }
    ],
    "favoriteGenres": [
      {
        "genreId": "1111-2222-...",
        "name": "ROCK"
      },
      {
        "genreId": "3333-4444-...",
        "name": "JAZZ"
      }
    ]
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 404  | 존재하지 않는 userId |

---

## GET /users/

**설명:** 유저 전체 검색 (닉네임 또는 이메일 기반 필터, 커서 페이지네이션)
**인증:** 불필요

### Request

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| where__nickname__contain | string | 선택 | - | nickname에 포함된 단어로 검색 |
| where__email__contain | string | 선택 | - | email에 포함된 단어로 검색 |
| order__created_at | string (`ASC`\|`DESC`) | 선택 | `DESC` | 생성일 기준 정렬 |
| order__id | string (`ASC`\|`DESC`) | 선택 | - | ID 기준 정렬 |
| take | number | 선택 | `20` | 페이지당 항목 수 |

### Response 200

```json
{
  "data": {
    "items": [
      {
        "id": "b6d0f0b1-7c7d-4e23-9c7b-0c0d9f6a2a21",
        "email": "devjunsday@gmail.com",
        "nickname": "devjun",
        "status": "ACTIVE",
        "avatarUrl": "https://cdn.domain.com/avatar.png",
        "createdAt": "2026-03-01T10:15:22.123+09:00"
      },
      {
        "id": "c1a2b3d4-9e7f-4c1d-a111-92ad9f1c22bb",
        "email": "devjun2@gmail.com",
        "nickname": "devjun_guitar",
        "status": "ACTIVE",
        "avatarUrl": null,
        "createdAt": "2026-02-28T09:11:10.000+09:00"
      }
    ],
    "meta": {
      "count": 2,
      "take": 20,
      "cursor": {
        "createdAt": "2026-02-28T09:11:10.000+09:00",
        "id": "c1a2b3d4-9e7f-4c1d-a111-92ad9f1c22bb"
      },
      "next": null
    }
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400  | 잘못된 쿼리 파라미터 형식 |

---

## PATCH /users/:userId/profiles

**설명:** 로그인한 유저의 프로필 수정 (유저 정보 + 프로필 + 스킬 + 좋아하는 장르 일괄 처리)
**인증:** 필요 (JWT Bearer)

### Request

**Body**

```json
{
  "profile": {
    "nickname": "devjun",
    "selfDescription": "기타 좋아함 🎸",
    "profileMusic": {
      "externalTrackId": "123456789",
      "sourceType": "DEEZER",
      "title": "Bohemian Rhapsody",
      "artistName": "Queen",
      "albumName": "A Night at the Opera",
      "albumImageUrl": "https://cdn.deezer.com/images/album/cover.jpg",
      "durationMs": 354000,
      "previewUrl": "https://cdn.deezer.com/preview/abc123.mp3",
      "sourceUrl": "https://www.deezer.com/track/123456789"
    },
    "avatarUrl": "https://cdn.domain.com/avatar.png"
  },
  "personalInfo": {
    "email": "newmail@gmail.com"
  },
  "skills": [
    {
      "skillTypeId": "uuid-1",
      "level": "ADVANCED",
      "isPrimary": true
    },
    {
      "skillTypeId": "uuid-2",
      "level": "INTERMEDIATE",
      "isPrimary": false
    }
  ],
  "favoriteGenres": [
    "genre-uuid-1",
    "genre-uuid-2"
  ]
}
```

> 모든 요청이 한 번에 처리됨 (FE 낙관적 업데이트 기준). 변경사항이 있는 부분만 `true` 반환.

### Response 200

```json
{
  "data": {
    "updated": {
      "profile": true,
      "personalInfo": true,
      "skills": true,
      "favoriteGenres": true
    }
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400  | 잘못된 입력 |
| 401  | 인증 실패 (토큰 없음 또는 만료) |
| 404  | 유저 없음 |

---

## DELETE /users/ _(미구현)_

**설명:** 회원탈퇴. deletedAt 소프트 삭제 후 특정일 경과 시 완전 삭제 예정
**인증:** 필요 (JWT Bearer)

### Request

요청 바디 없음.

### Response 200

```json
{
  "data": {
    "userId": "b6d0f0b1-7c7d-4e23-9c7b-0c0d9f6a2a21",
    "deletedAt": "2026-03-03T18:02:10.123+09:00"
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 401  | 인증 실패 |
| 404  | 유저 없음 |

---

## POST /auth/email

**설명:** 이메일 중복 확인
**인증:** 불필요

### Request

**Body**

```json
{
  "email": "devjunsday@gmail.com"
}
```

### Response 200

중복된 이메일인 경우:

```json
{
  "data": {
    "email": "devjunsday@gmail.com"
  },
  "success": true
}
```

> `message` 값으로 중복 여부를 구분: `"중복 된 이메일입니다."` / `"사용할 수 있는 이메일입니다."`

사용 가능한 이메일인 경우도 동일한 200 응답 구조 사용.

### Error Responses

| 코드 | 조건 |
|------|------|
| 400  | 이메일 형식 오류 |

---

## GET /users/profile-music/search

**설명:** 프로필 음악 검색 (곡명 또는 아티스트명 기반, Deezer 연동)
**인증:** 필요 (JWT Bearer)

### Request

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| query | string | ✅ | - | 검색어 (곡명 또는 아티스트명) |

### Response 200

```json
{
  "data": {
    "items": [
      {
        "externalTrackId": "123456789",
        "sourceType": "DEEZER",
        "title": "Bohemian Rhapsody",
        "artistName": "Queen",
        "albumName": "A Night at the Opera",
        "albumImageUrl": "https://cdn.deezer.com/images/album/cover.jpg",
        "durationMs": 354000,
        "previewUrl": "https://cdn.deezer.com/preview/abc123.mp3",
        "sourceUrl": "https://www.deezer.com/track/123456789"
      }
    ]
  },
  "success": true
}
```

> `previewUrl`은 Deezer 만료 파라미터 포함 가능 — 장기 저장 금지.
> 곡 선택 후 저장 시 `PATCH /users/profiles` body의 `profileMusic`에 전체 메타데이터를 담아 전송.

### Error Responses

| 코드 | 조건 |
|------|------|
| 400  | query 파라미터 누락 |
| 401  | 인증 실패 |

---

## #48 비밀번호 찾기 _(미구현, 경로 미정)_

**설명:** 비밀번호 찾기 기능 (미구현, Notion 페이지 내용 없음)
**인증:** 미정

> Notion 원본 페이지가 blank 상태로, 경로 및 명세 미정.
