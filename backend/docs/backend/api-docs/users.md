# 유저 API 명세

유저 프로필 조회·수정·탈퇴, 프로필 음악 검색·삭제 도메인을 정리한다.

> ⚠️ 변환 노트: [설계자 보완 2026-06-26]
> - users.md 신규 생성. 기존 구현(Controller/Service)과 확정된 API 명세(#68, #69)를 기반으로 작성.
> - #3: 기존 `profile.profileMusicUrl` → `profileMusic: ProfileMusicTrack | null` 로 교체 (스키마 변경 반영)
> - #5: 기존 `profile.profileMusicUrl` → `profile.profileMusic?: ProfileMusicTrack | null` 로 교체. `null` 전달 시 삭제 안 함.
> - #68, #69: 사용자 승인된 새 API 명세 추가.
> - 에러 코드 표준(400/401/403/404) 전체 보완.

## API 목록

| 번호 | 메서드 | 경로 | 설명 |
|------|--------|------|------|
| #1 | GET | `/users` | 유저 목록 조회 |
| #3 | GET | `/users/:userId/profiles` | 유저 프로필 조회 |
| #5 | PATCH | `/users/:userId/profiles` | 유저 프로필 수정 |
| #7 | DELETE | `/users/:userId` | 회원 탈퇴 |
| #68 | GET | `/users/profile-music/search` | 프로필 음악 검색 (Deezer) |
| #69 | DELETE | `/users/:userId/profile-music` | 프로필 음악 삭제 |

---

## #1 유저 목록 조회

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

> 참고: `profile`이 없으면 `null`. `profileMusic`이 없으면 `null`.

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

> 참고: `profile.profileMusic`은 선택 필드. 전달하면 upsert, 미전달 시 변경 없음. 삭제는 #69 전용. `profileMusic: null` 전달은 변경 없음(삭제 아님).

### Response 200

`#3`과 동일한 구조의 `GetUserProfileResult`.

### Error

| 코드 | 사유 |
|------|------|
| 400 | 잘못된 입력값 |
| 401 | 인증 실패 |
| 403 | 본인 프로필만 수정 가능 |
| 404 | 존재하지 않는 유저 |

---

## #7 회원 탈퇴

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
  "message": "프로필 음악이 삭제되었습니다.",
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
