# 유저 API 명세

인증(회원가입/로그인/토큰), 유저 프로필 조회·수정·탈퇴, 프로필 음악 검색·삭제 도메인을 정리한다.
Notion "유저 api" 데이터베이스는 `src/auth`(인증)와 `src/modules/users`(유저) 두 컨트롤러를 함께 묶어 관리한다.

> 최종 동기화: 2026-07-05
>
> ⚠️ 변환 노트: [코드 기반 재작성 2026-07-05]
> - 기존 문서의 번호가 실제 Notion 번호와 어긋나 있어(예: 옛 `#1`이 실제로는 `#4`의 내용) 전면 재작성.
> - `src/auth/auth.controller.ts`, `src/modules/users/users.controller.ts` 코드를 1차 소스로 삼아 작성. 번호는 Notion "유저 api" DB 기준 유지.
> - `#48 비밀번호 찾기`는 Notion에는 존재하나 코드에 미구현 — 이번 문서에서 제외. 구현 후 추가한다.
> - `#65 이메일 중복 확인`: `팀 관리` DB에도 동일 번호(#65)가 팀 멤버 추가 기능에 부여되어 있어 Notion 번호 체계에 충돌이 있다. 두 문서 모두 각자 소속 DB의 번호를 그대로 사용한다(교차 수정은 이번 범위 밖).
> - [설계자 보완 2026-09-01] `#70 Google 로그인` 신규 추가 (기존 최대 #69 + 1). Notion "유저 api" DB에는 아직 미등록 — 수동 등록 필요.

## API 목록

| 번호 | 메서드 | 경로 | 설명 |
|------|--------|------|------|
| #1 | POST | `/auth/register/email` | 이메일 회원가입 |
| #2 | POST | `/auth/login/email` | 이메일 로그인 |
| #70 | POST | `/auth/login/google` | Google 로그인 |
| #4 | GET | `/users` | 유저 목록 조회 |
| #6 | DELETE | `/users/:userId` | 회원 탈퇴 |
| #7 | POST | `/auth/token/access` | 액세스 토큰 재발급 |
| #8 | POST | `/auth/token/refresh` | 리프레시 토큰 재발급 |
| #65 | POST | `/auth/email` | 이메일 중복 확인 |
| #68 | GET | `/users/profile-music/search` | 프로필 음악 검색 (Deezer) |
| #69 | DELETE | `/users/:userId/profile-music` | 프로필 음악 삭제 |
| #3 | GET | `/users/:userId/profiles` | 유저 프로필 조회 |
| #5 | PATCH | `/users/:userId/profiles` | 유저 프로필 수정 |

---

## #1 이메일 회원가입

- Method: `POST`
- Path: `/auth/register/email`
- 인증: 없음 (공개)

### Request Body

```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "홍길동"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `email` | string | Y | 이메일 형식 |
| `password` | string | Y | 최소 8자, 알파벳·숫자·특수문자(`!@#$%^&*()`) 각 1개 이상 포함 |
| `name` | string | Y | 2~255자. 프로필 닉네임으로 저장된다 |

### Response 201

```json
{
  "success": true,
  "message": "회원가입 성공",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | 이메일 형식 불일치, 비밀번호 패턴 불일치, 이미 존재하는 이메일 |

---

## #2 이메일 로그인

- Method: `POST`
- Path: `/auth/login/email`
- 인증: HTTP Basic (`Authorization: Basic base64(email:password)`)

### Request

Body 없음. `Authorization` 헤더에 `email:password`를 base64로 인코딩한 Basic 토큰을 전달한다.

### Response 201

```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 401 | `Authorization` 헤더 없음, 잘못된 Basic 토큰 형식, 존재하지 않는 유저, 비밀번호 불일치 |

---

## #70 Google 로그인

- Method: `POST`
- Path: `/auth/login/google`
- 인증: 없음 (공개)

### Request Body

```json
{
  "idToken": "eyJhbGciOi..."
}
```

`idToken`은 프론트가 Google Identity Services(GIS)에서 받은 ID 토큰이다.
서버는 서명·만료·audience(`GOOGLE_CLIENT_ID`)를 검증한 뒤, Google 계정이 연결된 유저로 로그인한다.
연결된 유저가 없으면 동일 이메일 유저에 자동 연결하고, 그것도 없으면 신규 가입 후 로그인한다.

### Response 201

```json
{
  "status": "success",
  "error": null,
  "message": "로그인 성공",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `idToken` 누락 또는 문자열이 아님 |
| 401 | 유효하지 않은 Google 토큰, 이메일 미인증 Google 계정, 탈퇴한 계정, 비활성화된 계정, Gmail·Workspace(hd)가 아닌 이메일로 기존 계정 자동 연결 시도 |

---

## #4 유저 목록 조회

- Method: `GET`
- Path: `/users`
- 인증: 없음 (공개)

### Query Parameters

| 이름 | 필수 | 설명 |
|------|------|------|
| `take` | N | 가져올 유저 수 (기본값: 20) |
| `order__created_at` | N | 생성일 정렬 (`asc` / `desc`, 기본값: `desc`) |
| `order__id` | N | ID 정렬 (`asc` / `desc`, 기본값: `desc`) |
| `cursor__created_at` | N | 커서 기반 페이지네이션 — 마지막 아이템 생성일 |
| `cursor__id` | N | 커서 기반 페이지네이션 — 마지막 아이템 ID (UUID) |
| `where__nickname__contain` | N | 닉네임 부분 검색 |
| `where__email__contain` | N | 이메일 부분 검색 |

### Response 200

```json
{
  "success": true,
  "message": "유저 목록 조회 성공",
  "data": {
    "items": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "nickname": "홍길동",
        "status": "ACTIVE",
        "avatarUrl": null,
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "meta": {
      "count": 1,
      "take": 20,
      "cursor": { "createdAt": "2026-01-01T00:00:00.000Z", "id": "uuid" },
      "next": null
    }
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `take` 범위 오류, `order` 값 오류, `cursor__id` UUID 형식 오류 |

---

## #6 회원 탈퇴

- Method: `DELETE`
- Path: `/users/:userId`
- 인증: AccessToken + SelfUser

### Path Parameters

| 이름 | 설명 |
|------|------|
| `userId` | 유저 ID (UUID) |

### Response 200

```json
{
  "success": true,
  "message": "회원 탈퇴가 완료되었습니다.",
  "data": {
    "userId": "uuid",
    "deletedAt": "2026-06-26T00:00:00.000Z"
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `userId`가 UUID 형식이 아님 |
| 401 | 인증 실패 |
| 403 | 본인 계정만 탈퇴 가능 |
| 404 | 존재하지 않는 유저 |

---

## #7 액세스 토큰 재발급

- Method: `POST`
- Path: `/auth/token/access`
- 인증: Bearer RefreshToken (`Authorization: Bearer <refreshToken>`)

### Response 201

```json
{
  "success": true,
  "message": "액세스 토큰 재발급 성공",
  "data": {
    "accessToken": "eyJhbGciOi..."
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 401 | 토큰 없음, 리프레시 토큰이 아님, 유효하지 않은 토큰, 존재하지 않는 유저 |

---

## #8 리프레시 토큰 재발급

- Method: `POST`
- Path: `/auth/token/refresh`
- 인증: Bearer RefreshToken (`Authorization: Bearer <refreshToken>`)

### Response 201

```json
{
  "success": true,
  "message": "리프레시 토큰 재발급 성공",
  "data": {
    "refreshToken": "eyJhbGciOi..."
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 401 | 토큰 없음, 리프레시 토큰이 아님, 유효하지 않은 토큰, 존재하지 않는 유저 |

---

## #65 이메일 중복 확인

- Method: `POST`
- Path: `/auth/email`
- 인증: 없음 (공개)

### Request Body

```json
{
  "email": "user@example.com"
}
```

### Response 201

```json
{
  "success": true,
  "message": "중복 된 이메일입니다.",
  "data": {
    "email": "user@example.com"
  }
}
```

> `message`는 중복 여부에 따라 `"중복 된 이메일입니다."` 또는 `"사용할 수 있는 이메일입니다."`로 달라진다.

### Error

| 코드 | 사유 |
|------|------|
| 400 | 이메일 형식 오류 |

---

## #68 프로필 음악 검색

- Method: `GET`
- Path: `/users/profile-music/search`
- 인증: 없음 (공개)

### Query Parameters

| 이름 | 필수 | 설명 |
|------|------|------|
| `q` | Y | 검색어 (곡명, 아티스트명 등) |

### Response 200

```json
{
  "success": true,
  "message": "프로필 음악 검색 성공",
  "data": {
    "items": [
      {
        "externalTrackId": "12345",
        "sourceType": "DEEZER",
        "title": "Blinding Lights",
        "artistName": "The Weeknd",
        "albumName": "After Hours",
        "albumImageUrl": "https://example.com/album.jpg",
        "durationMs": 200000,
        "previewUrl": "https://cdns-preview.dzcdn.net/...",
        "sourceUrl": "https://www.deezer.com/track/12345"
      }
    ]
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `q` 파라미터 누락 |

---

## #69 프로필 음악 삭제

- Method: `DELETE`
- Path: `/users/:userId/profile-music`
- 인증: AccessToken + SelfUser

### Path Parameters

| 이름 | 설명 |
|------|------|
| `userId` | 유저 ID (UUID) |

### Response 200

```json
{
  "success": true,
  "message": "프로필 음악 삭제 성공",
  "data": {
    "userId": "uuid",
    "deletedAt": "2026-06-26T00:00:00.000Z"
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 401 | 인증 실패 |
| 403 | 본인 프로필 음악만 삭제 가능 |
| 404 | 프로필 음악이 존재하지 않음 |

---

## #3 유저 프로필 조회

- Method: `GET`
- Path: `/users/:userId/profiles`
- 인증: 없음 (공개)

### Path Parameters

| 이름 | 설명 |
|------|------|
| `userId` | 유저 ID (UUID) |

### Response 200

```json
{
  "success": true,
  "message": "유저 프로필 조회 성공",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "status": "ACTIVE",
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    "profile": {
      "nickname": "홍길동",
      "selfDescription": "기타를 사랑합니다.",
      "avatarUrl": "https://example.com/avatar.jpg",
      "profileMusic": {
        "externalTrackId": "12345",
        "sourceType": "DEEZER",
        "title": "Blinding Lights",
        "artistName": "The Weeknd",
        "albumName": "After Hours",
        "albumImageUrl": "https://example.com/album.jpg",
        "durationMs": 200000,
        "previewUrl": "https://cdns-preview.dzcdn.net/...",
        "sourceUrl": "https://www.deezer.com/track/12345"
      }
    },
    "skills": [
      {
        "skillTypeId": "uuid",
        "skillName": "기타",
        "level": "INTERMEDIATE",
        "isPrimary": true
      }
    ],
    "favoriteGenres": [
      {
        "genreId": "uuid",
        "name": "록"
      }
    ]
  }
}
```

> 참고: `profile`이 없으면 `null`. `profile.profileMusic`이 없으면 `null`. (2026-09-06 정정: 최상위 `profileMusic` → `profile.profileMusic`, 수정 요청 형태와 통일)

### Error

| 코드 | 사유 |
|------|------|
| 400 | `userId`가 UUID 형식이 아님 |
| 404 | 존재하지 않는 유저 |

---

## #5 유저 프로필 수정

- Method: `PATCH`
- Path: `/users/:userId/profiles`
- 인증: AccessToken + SelfUser

### Path Parameters

| 이름 | 설명 |
|------|------|
| `userId` | 유저 ID (UUID) |

### Request Body

```json
{
  "profile": {
    "nickname": "새닉네임",
    "selfDescription": "새 소개글",
    "avatarUrl": "https://example.com/avatar.jpg",
    "profileMusic": {
      "externalTrackId": "12345",
      "sourceType": "DEEZER",
      "title": "Blinding Lights",
      "artistName": "The Weeknd",
      "albumName": "After Hours",
      "albumImageUrl": "https://example.com/album.jpg",
      "durationMs": 200000,
      "previewUrl": "https://cdns-preview.dzcdn.net/...",
      "sourceUrl": "https://www.deezer.com/track/12345"
    }
  },
  "personalInfo": {
    "email": "new@example.com"
  },
  "skills": [
    {
      "skillTypeId": "uuid",
      "level": "INTERMEDIATE",
      "isPrimary": true
    }
  ],
  "favoriteGenres": ["uuid"]
}
```

> 참고: `profile.profileMusic`은 선택 필드. 전달하면 upsert, 미전달 시 변경 없음. 삭제는 `#69` 전용. `profileMusic: null` 전달은 변경 없음(삭제 아님).

### Response 200

`#3 유저 프로필 조회`와 동일한 구조의 `GetUserProfileResult`.

### Error

| 코드 | 사유 |
|------|------|
| 400 | 잘못된 입력값 |
| 401 | 인증 실패 |
| 403 | 본인 프로필만 수정 가능 |
| 404 | 존재하지 않는 유저 |
