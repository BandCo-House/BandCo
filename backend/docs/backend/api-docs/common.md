# Common API

> 최종 동기화: 2026-07-05
>
> ⚠️ 변환 노트:
> - 두 API 모두 인증 불필요 (Notion 명세에 Authorization 언급 없음).
> - [코드 기반 보완 2026-07-05] Notion "기타api" DB 번호(#66, #67) 표기 추가 (하네스 API 넘버링 보존 규칙 반영).

---

## #66 GET /common/genres

**설명:** 장르 전체 목록 조회
**인증:** 불필요

### Request

쿼리 파라미터 없음.

**요청 예시**
```
GET /common/genres
```

### Response 200

```json
{
  "status": "success",
  "error": null,
  "message": "장르 목록 조회 완료",
  "data": {
    "genres": [
      {
        "genreId": "uuid",
        "name": "락"
      },
      {
        "genreId": "uuid",
        "name": "재즈"
      },
      {
        "genreId": "uuid",
        "name": "팝"
      }
    ]
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `status` | `"success"` | 응답 상태 |
| `error` | `null` | 에러 없음 |
| `message` | string | 결과 메시지 |
| `data.genres` | `GenreItem[]` | 장르 목록 |
| `data.genres[].genreId` | string (UUID) | 장르 ID |
| `data.genres[].name` | string | 장르명 |

### Error Responses

| 코드 | 조건 |
|------|------|
| 500 | 서버 오류 |

---

## #67 GET /common/skills

**설명:** 스킬 타입 전체 목록 조회
**인증:** 불필요

### Request

쿼리 파라미터 없음.

**요청 예시**
```
GET /common/skills
```

### Response 200

```json
{
  "status": "success",
  "error": null,
  "message": "스킬 목록 조회 완료",
  "data": {
    "skills": [
      {
        "skillTypeId": "uuid",
        "name": "보컬"
      },
      {
        "skillTypeId": "uuid",
        "name": "일렉기타"
      },
      {
        "skillTypeId": "uuid",
        "name": "베이스"
      },
      {
        "skillTypeId": "uuid",
        "name": "드럼"
      }
    ]
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `status` | `"success"` | 응답 상태 |
| `error` | `null` | 에러 없음 |
| `message` | string | 결과 메시지 |
| `data.skills` | `SkillTypeItem[]` | 스킬 타입 목록 |
| `data.skills[].skillTypeId` | string (UUID) | 스킬 타입 ID |
| `data.skills[].name` | string | 스킬 타입명 |

### Error Responses

| 코드 | 조건 |
|------|------|
| 500 | 서버 오류 |
