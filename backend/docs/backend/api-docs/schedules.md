# 일정 관리 API

> 최종 동기화: 2026-05-29 | Notion: https://www.notion.so/e6642fc9fb3182618fb501f827f15421
>
> ⚠️ 변환 노트:
> - Notion 원본 응답 형식은 `{ "status": "success", "error": null, "message": "...", "data": {...} }` 구조이며, `status`/`error`/`message` 필드가 포함된다. 스킬 규칙의 `{ "data": ..., "success": true }` 형식과 다르므로 Notion 원본 형식을 그대로 유지함.
> - #48 일정 목록 조회(밴드 기준) 응답 JSON 원본이 여는 중괄호(`{`) 없이 시작하는 오기가 있어 수정하여 기록함.
> - teams 도메인 MVP 제외로 teamIds/teams 필드를 Request/Response에서 제거함.
> - scheduleType enum: PRACTICE | MEETING / status enum: PLANNED | DONE | CANCELED (Prisma schema 기준)
> - PATCH body 전체 필드 선택 (partial update 패턴). POST에서 memo, placeId, songIds, participants, externalLinks, referenceFiles는 선택.
> - ⚠️ 변환 노트: [설계자 보완 2026-09-06] 세션 편성 추가 — 요청에 `participants: { bandMemberId, skillTypeId? }[]` 추가(기존 `participantBandMemberIds`는 deprecated이나 하위호환으로 계속 받으며, 둘 다 오면 `participants`가 우선), 상세 응답 participants에 `skillType` 추가, songs에 `key` 추가.

---

## POST /bandspaces/{bandspaceId}/schedules

**설명:** 밴드 공간에 합주 일정을 생성한다.
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandspaceId | string (UUID) | ✅ | 밴드 공간 ID |

**Body**
```json
{
  "title": "좋은 날 합주",
  "scheduleType": "PRACTICE",
  "startAt": "2026-02-18T14:00:00+09:00",
  "endAt": "2026-02-18T16:00:00+09:00",
  "placeId": "place-uuid",
  "status": "PLANNED",
  "songIds": [
    "song-uuid"
  ],
  "participants": [
    { "bandMemberId": "band-member-uuid", "skillTypeId": "skill-type-uuid" },
    { "bandMemberId": "band-member-uuid", "skillTypeId": "other-skill-type-uuid" }
  ],
  "participantBandMemberIds": [
    "band-member-uuid-1",
    "band-member-uuid-2"
  ],
  "memo": "후반부 템포 점검",
  "externalLinks": ["https://example.com/notice"],
  "referenceFiles": [
    {
      "fileUrl": "https://storage.example.com/schedule-references/uuid.pdf",
      "fileName": "합주 공지.pdf"
    }
  ]
}
```

> 선택 필드: placeId, songIds, participantBandMemberIds, memo, externalLinks, referenceFiles

### Response 200
```json
{
  "status": "success",
  "error": null,
  "message": "합주 일정 생성 성공",
  "data": {
    "scheduleId": "schedule-uuid",
    "spaceId": "space-uuid",
    "placeId": "place-uuid",
    "createdByBandMemberId": "band-member-uuid",
    "scheduleType": "PRACTICE",
    "title": "좋은 날 합주",
    "startAt": "2026-02-18T14:00:00+09:00",
    "endAt": "2026-02-18T16:00:00+09:00",
    "status": "PLANNED",
    "songs": [
      {
        "songId": "song-uuid",
        "title": "좋은 날",
        "artistName": "IU"
      }
    ],
    "participantCount": 2,
    "memo": "후반부 템포 점검",
    "externalLinks": ["https://example.com/notice"],
    "referenceFiles": [
      {
        "id": "reference-file-uuid",
        "fileUrl": "https://storage.example.com/schedule-references/uuid.pdf",
        "fileName": "합주 공지.pdf",
        "createdAt": "2026-04-30T14:16:00.000+09:00"
      }
    ],
    "createdAt": "2026-04-30T14:16:00.000+09:00"
  }
}
```

### Error Responses
| 코드 | 조건 |
|------|------|
| 400 | 잘못된 입력 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 밴드 공간 없음 |

---

## PATCH /schedules/{scheduleId}

**설명:** 일정 정보를 수정한다.
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| scheduleId | string (UUID) | ✅ | 일정 ID |

**Body**
```json
{
  "title": "좋은 날 합주",
  "scheduleType": "PRACTICE",
  "startAt": "2026-02-18T15:00:00+09:00",
  "endAt": "2026-02-18T17:00:00+09:00",
  "placeId": "place-uuid",
  "status": "PLANNED",
  "songIds": [
    "song-uuid"
  ],
  "participants": [
    { "bandMemberId": "band-member-uuid", "skillTypeId": "skill-type-uuid" },
    { "bandMemberId": "band-member-uuid", "skillTypeId": "other-skill-type-uuid" }
  ],
  "participantBandMemberIds": [
    "band-member-uuid-1",
    "band-member-uuid-2",
    "band-member-uuid-3"
  ],
  "memo": "후반부 템포 + 엔딩 합 맞추기",
  "externalLinks": [],
  "referenceFiles": []
}
```

> 모든 필드 선택 (partial update — 전달된 필드만 업데이트). `externalLinks`, `referenceFiles`는 전달 시 전체 교체하며 빈 배열은 전체 삭제를 뜻한다.

### Response 200
```json
{
  "status": "success",
  "error": null,
  "message": "합주 일정 수정 성공",
  "data": {
    "scheduleId": "schedule-uuid",
    "spaceId": "space-uuid",
    "scheduleType": "PRACTICE",
    "title": "좋은 날 합주",
    "startAt": "2026-02-18T15:00:00+09:00",
    "endAt": "2026-02-18T17:00:00+09:00",
    "placeId": "place-uuid",
    "status": "PLANNED",
    "songIds": [
      "song-uuid"
    ],
    "participantCount": 3,
    "memo": "후반부 템포 + 엔딩 합 맞추기",
    "externalLinks": [],
    "referenceFiles": [],
    "updatedAt": "2026-04-30T14:20:00.000+09:00"
  }
}
```

### Error Responses
| 코드 | 조건 |
|------|------|
| 400 | 잘못된 입력 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 일정 없음 |

---

## DELETE /schedules/{scheduleId}

**설명:** 일정을 삭제한다.
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| scheduleId | string (UUID) | ✅ | 일정 ID |

### Response 200
```json
{
  "status": "success",
  "error": null,
  "message": "합주 일정 삭제 성공",
  "data": {
    "scheduleId": "schedule-uuid",
    "deletedAt": "2026-04-30T14:30:00.000+09:00"
  }
}
```

### Error Responses
| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 일정 없음 |

---

## GET /bandspaces/{bandspaceId}/schedules

**설명:** 밴드 공간 기준으로 일정 목록을 조회한다.
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandspaceId | string (UUID) | ✅ | 밴드 공간 ID |

**Query Parameters**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| take | number | - | 50 | 조회 개수 |
| where__start_at__greater__than_equal | string (ISO8601) | - | - | 시작일시 이상 필터 |
| where__start_at__less_than_equal | string (ISO8601) | - | - | 시작일시 이하 필터 |
| where__place_id | string (UUID) | - | - | 장소 ID 필터 |
| where__schedule_type | string | - | - | 일정 유형 필터 |
| where__status | string | - | - | 상태 필터 |

### Response 200
```json
{
  "status": "success",
  "error": null,
  "message": "합주 일정 목록 조회 성공",
  "data": {
    "items": [
      {
        "scheduleId": "schedule-uuid",
        "spaceId": "space-uuid",
        "scheduleType": "PRACTICE",
        "title": "좋은 날 합주",
        "startAt": "2026-02-18T14:00:00+09:00",
        "endAt": "2026-02-18T16:00:00+09:00",
        "place": {
          "placeId": "place-uuid",
          "name": "연습실 A"
        },
        "songs": [
          {
            "songId": "song-uuid",
            "title": "좋은 날",
            "artistName": "IU",
          "key": "F_SHARP_MINOR"
          }
        ],
        "participantCount": 4,
        "memo": "후렴 파트 합 맞추기",
        "status": "PLANNED"
      }
    ],
    "meta": {
      "count": 1,
      "take": 50,
      "cursor": {
        "startAt": "2026-02-18T14:00:00+09:00",
        "id": "schedule-uuid"
      },
      "next": null
    }
  }
}
```

### Error Responses
| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 밴드 공간 없음 |

---

## GET /bands/{bandId}/schedules

**설명:** 밴드 기준으로 전체 일정 목록을 조회한다.
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 밴드 ID |

**Query Parameters**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| take | number | - | 50 | 조회 개수 |
| where__start_at__greater__than_equal | string (ISO8601) | - | - | 시작일시 이상 필터 |
| where__start_at__less_than_equal | string (ISO8601) | - | - | 시작일시 이하 필터 |
| where__place_id | string (UUID) | - | - | 장소 ID 필터 |
| where__schedule_type | string | - | - | 일정 유형 필터 |
| where__status | string | - | - | 상태 필터 |

### Response 200
```json
{
  "status": "success",
  "error": null,
  "message": "밴드 일정 목록 조회 성공",
  "data": {
    "items": [
      {
        "scheduleId": "schedule-uuid",
        "spaceId": "space-uuid",
        "space": {
          "spaceId": "space-uuid",
          "name": "2026 하계공연 준비"
        },
        "scheduleType": "PRACTICE",
        "title": "좋은 날 합주",
        "startAt": "2026-02-18T14:00:00+09:00",
        "endAt": "2026-02-18T16:00:00+09:00",
        "status": "PLANNED"
      }
    ],
    "meta": {
      "count": 1,
      "take": 50,
      "cursor": {
        "startAt": "2026-02-18T14:00:00+09:00",
        "id": "schedule-uuid"
      },
      "next": null
    }
  }
}
```

### Error Responses
| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 밴드 없음 |

---

## GET /schedules/{scheduleId}

**설명:** 일정 상세 정보를 조회한다.
**인증:** 필요 (JWT Bearer)

### Request

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| scheduleId | string (UUID) | ✅ | 일정 ID |

### Response 200
```json
{
  "status": "success",
  "error": null,
  "message": "합주 일정 상세 조회 성공",
  "data": {
    "schedule": {
      "scheduleId": "schedule-uuid",
      "spaceId": "space-uuid",
      "scheduleType": "PRACTICE",
      "title": "좋은 날 합주",
      "startAt": "2026-02-18T14:00:00+09:00",
      "endAt": "2026-02-18T16:00:00+09:00",
      "status": "PLANNED",
      "place": {
        "placeId": "place-uuid",
        "name": "연습실 A",
        "address": "서울시 강남구 ..."
      },
      "songs": [
        {
          "songId": "song-uuid",
          "title": "좋은 날",
          "artistName": "IU",
          "key": "F_SHARP_MINOR"
        }
      ],
      "participants": [
        {
          "participantId": "participant-uuid",
          "bandMemberId": "band-member-uuid",
          "attendanceStatus": "PENDING",
          "note": null,
          "skillType": { "skillTypeId": "skill-type-uuid", "name": "보컬" }
        }
      ],
      "memo": "후렴 파트 합 맞추기",
      "externalLinks": ["https://example.com/notice"],
      "referenceFiles": [
        {
          "id": "reference-file-uuid",
          "fileUrl": "https://storage.example.com/schedule-references/uuid.pdf",
          "fileName": "합주 공지.pdf",
          "createdAt": "2026-04-30T14:16:00.000+09:00"
        }
      ],
      "createdByBandMemberId": "band-member-uuid",
      "createdAt": "2026-04-30T14:16:00.000+09:00",
      "updatedAt": "2026-04-30T14:16:00.000+09:00"
    }
  }
}
```

### Error Responses
| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 일정 없음 |
