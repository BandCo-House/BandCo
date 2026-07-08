# 곡 API 명세

밴드 내 곡 생성·목록조회·수정·삭제, 외부 음원(Deezer) 검색·미리듣기 도메인을 정리한다.

> 최초 작성: 2026-07-05 [코드 기반 신규 작성]
>
> ⚠️ 변환 노트:
> - Notion "곡 api" 데이터베이스에 대응하는 로컬 문서가 없어 `src/modules/songs/songs.controller.ts`, `songs.service.ts` 코드를 1차 소스로 신규 작성.
> - Notion 번호(#24~27)는 곡 CRUD 4종에 대응한다. 외부 음원 검색/미리듣기 2종은 Notion에 번호 없는 별도 페이지로 존재.

## API 목록

| 번호 | 메서드 | 경로 | 설명 |
|------|--------|------|------|
| #24 | POST | `/bands/:bandId/songs` | 곡 생성 |
| #25 | GET | `/bands/:bandId/songs` | 밴드 곡 목록 조회 |
| #26 | PATCH | `/songs/:songId` | 곡 수정 |
| #27 | DELETE | `/songs/:songId` | 곡 삭제 |
| - | GET | `/songs/tracks/search` | 외부 음원 곡 검색 |
| - | GET | `/songs/tracks/:trackId` | 외부 음원 곡 미리듣기 |

---

## #24 곡 생성

- Method: `POST`
- Path: `/bands/:bandId/songs`
- 인증: AccessToken (밴드 멤버만 가능)

### Path Parameters

| 이름 | 설명 |
|------|------|
| `bandId` | 밴드 ID (UUID) |

### Request Body

```json
{
  "title": "Bohemian Rhapsody",
  "artistName": "Queen",
  "sourceUrl": "https://open.spotify.com/track/...",
  "sourceType": "SPOTIFY",
  "memo": "인트로 부분 연습 필요",
  "skillTypeIds": ["uuid"]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `title` | string (최대 200자) | Y | 곡 제목 |
| `artistName` | string (최대 200자) | Y | 아티스트 이름 |
| `sourceUrl` | string | Y | 음원 URL |
| `sourceType` | `"SPOTIFY" \| "DEEZER"` | Y | 음원 출처 |
| `memo` | string | N | 곡 메모 |
| `skillTypeIds` | string[] (UUID) | N | 관련 스킬 타입 ID 목록 |

### Response 201

```json
{
  "success": true,
  "message": "곡 생성 성공",
  "data": {
    "song": {
      "id": "uuid",
      "bandId": "uuid",
      "title": "Bohemian Rhapsody",
      "artistName": "Queen",
      "sourceUrl": "https://open.spotify.com/track/...",
      "sourceType": "SPOTIFY",
      "memo": "인트로 부분 연습 필요",
      "key": null,
      "bpm": null,
      "difficultyLevel": null,
      "userId": "uuid",
      "createdAt": "2026-07-05T00:00:00.000Z"
    },
    "skillTypes": [
      { "id": "uuid", "name": "기타" }
    ]
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | 필드 유효성 오류, 중복된 `skillTypeIds`, 존재하지 않는 `skillTypeIds` |
| 401 | 인증 실패 |
| 403 | 밴드 멤버가 아님 |
| 404 | 밴드를 찾을 수 없음 |

---

## #25 밴드 곡 목록 조회

- Method: `GET`
- Path: `/bands/:bandId/songs`
- 인증: AccessToken (밴드 멤버만 가능)

### Path Parameters

| 이름 | 설명 |
|------|------|
| `bandId` | 밴드 ID (UUID) |

### Query Parameters

| 이름 | 필수 | 설명 |
|------|------|------|
| `where__title__contain` | N | 곡 제목 검색어 |
| `where__artist_name__contain` | N | 아티스트 이름 검색어 |
| `order__created_at` | N | 생성일 정렬 (`asc` / `desc`, 기본값: `desc`) |
| `order__id` | N | ID 정렬 (`asc` / `desc`, 기본값: `desc`) |
| `take` | N | 가져올 항목 수 (기본값: 20) |
| `cursor__id` | N | 커서 ID (UUID) |

### Response 200

```json
{
  "success": true,
  "message": "곡 목록 조회 성공",
  "data": {
    "items": [
      {
        "id": "uuid",
        "bandId": "uuid",
        "title": "Bohemian Rhapsody",
        "artistName": "Queen",
        "key": null,
        "bpm": null,
        "difficultyLevel": null,
        "sourceUrl": "https://open.spotify.com/track/...",
        "sourceType": "SPOTIFY",
        "createdAt": "2026-07-05T00:00:00.000Z",
        "skills": [
          { "skillTypeId": "uuid", "skillName": "기타" }
        ]
      }
    ],
    "meta": {
      "count": 1,
      "take": 20,
      "cursor": { "id": "uuid" },
      "next": null
    }
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 401 | 인증 실패 |
| 403 | 밴드 멤버가 아님 |
| 404 | 밴드를 찾을 수 없음 |

---

## #26 곡 수정

- Method: `PATCH`
- Path: `/songs/:songId`
- 인증: AccessToken (밴드 멤버만 가능)

### Path Parameters

| 이름 | 설명 |
|------|------|
| `songId` | 곡 ID (UUID) |

### Request Body

전달된 필드만 업데이트한다. `sourceUrl`/`sourceType`/`memo`는 `null` 전달 시 삭제된다.

```json
{
  "title": "Bohemian Rhapsody",
  "artistName": "Queen",
  "sourceUrl": null,
  "sourceType": null,
  "memo": null,
  "skillTypeIds": ["uuid"]
}
```

### Response 200

```json
{
  "success": true,
  "message": "곡이 수정되었습니다.",
  "data": {
    "song": {
      "id": "uuid",
      "bandId": "uuid",
      "title": "Bohemian Rhapsody",
      "artistName": "Queen",
      "sourceUrl": null,
      "sourceType": null,
      "memo": null,
      "key": null,
      "bpm": null,
      "difficultyLevel": null,
      "updatedAt": "2026-07-05T00:00:00.000Z",
      "skills": [
        { "skillTypeId": "uuid", "skillName": "기타" }
      ]
    }
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | 수정할 필드 미전달, 필드 유효성 오류 |
| 401 | 인증 실패 |
| 403 | 밴드 멤버가 아님 |
| 404 | 곡을 찾을 수 없음 |

---

## #27 곡 삭제

- Method: `DELETE`
- Path: `/songs/:songId`
- 인증: AccessToken (밴드 멤버만 가능)

### Path Parameters

| 이름 | 설명 |
|------|------|
| `songId` | 곡 ID (UUID) |

### Response 200

```json
{
  "success": true,
  "message": "곡이 삭제되었습니다.",
  "data": {
    "songId": "uuid",
    "deletedAt": "2026-07-05T00:00:00.000Z"
  }
}
```

> Hard delete. 소프트 삭제가 아니다.

### Error

| 코드 | 사유 |
|------|------|
| 401 | 인증 실패 |
| 403 | 밴드 멤버가 아님 |
| 404 | 곡을 찾을 수 없음 |

---

## 외부 음원 곡 검색

- Method: `GET`
- Path: `/songs/tracks/search`
- 인증: 없음 (공개)

### Query Parameters

| 이름 | 필수 | 설명 |
|------|------|------|
| `query` | Y | 검색어 (곡명, 아티스트명 등) |

### Response 200

```json
{
  "success": true,
  "message": "곡 검색 성공",
  "data": [
    {
      "externalTrackId": "12345",
      "title": "Bohemian Rhapsody",
      "artistName": "Queen",
      "albumName": "A Night at the Opera",
      "albumImageUrl": "https://example.com/album.jpg",
      "releaseDate": "1975-10-31",
      "durationMs": 354000,
      "previewUrl": "https://cdns-preview.dzcdn.net/...",
      "sourceUrl": "https://www.deezer.com/track/12345",
      "sourceType": "DEEZER"
    }
  ]
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `query` 파라미터 누락 |
| 502 | Deezer 외부 API 호출 실패 |

---

## 외부 음원 곡 미리듣기

- Method: `GET`
- Path: `/songs/tracks/:trackId`
- 인증: 없음 (공개)

### Path Parameters

| 이름 | 설명 |
|------|------|
| `trackId` | 외부 음원 트랙 ID (Deezer) |

### Response 200

```json
{
  "success": true,
  "message": "곡 미리듣기 조회 성공",
  "data": {
    "externalTrackId": "12345",
    "title": "Bohemian Rhapsody",
    "artistName": "Queen",
    "albumName": "A Night at the Opera",
    "albumImageUrl": "https://example.com/album.jpg",
    "releaseDate": "1975-10-31",
    "durationMs": 354000,
    "previewUrl": "https://cdns-preview.dzcdn.net/...",
    "sourceUrl": "https://www.deezer.com/track/12345",
    "sourceType": "DEEZER"
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 404 | 트랙을 찾을 수 없음 |
| 502 | Deezer 외부 API 호출 실패 |
