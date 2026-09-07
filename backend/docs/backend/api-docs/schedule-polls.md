# 일정 조율 투표 API

> 코드 기반 신규 명세: 2026-09-07
>
> MVP 범위는 후보 시간 생성, 멤버별 투표, 후보별 집계 및 투표자 조회다. 기존 일정 분석, 실제 일정 생성, 마감, 알림은 포함하지 않는다.

## POST /bandspaces/{bandSpaceId}/schedule-polls

**설명:** 합주 공간에 일정 조율 투표를 생성한다.

**인증:** 필요 (JWT Bearer)

**권한:** 활성 합주 공간 멤버

### Request

```json
{
  "options": [
    {
      "startAt": "2026-09-13T21:00:00+09:00",
      "endAt": "2026-09-13T23:00:00+09:00"
    },
    {
      "startAt": "2026-09-14T20:00:00+09:00",
      "endAt": "2026-09-14T22:00:00+09:00"
    }
  ]
}
```

- 후보 시간은 한 개 이상이어야 한다.
- 각 후보의 `endAt`은 `startAt`보다 이후여야 한다.
- 동일한 시작·종료 시간 후보를 중복 등록할 수 없다.

### Response 201

```json
{
  "status": "success",
  "error": null,
  "message": "일정 조율 투표 생성 성공",
  "data": {
    "schedulePollId": "poll-uuid",
    "bandSpaceId": "space-uuid",
    "createdByBandMemberId": "member-uuid",
    "voterCount": 0,
    "options": [
      {
        "schedulePollOptionId": "option-uuid",
        "startAt": "2026-09-13T12:00:00.000Z",
        "endAt": "2026-09-13T14:00:00.000Z",
        "voters": [],
        "voteCount": 0,
        "isRecommended": false
      }
    ],
    "myOptionIds": [],
    "createdAt": "2026-09-07T00:00:00.000Z",
    "updatedAt": "2026-09-07T00:00:00.000Z"
  }
}
```

### Error Responses

| 코드 | 조건 |
|---|---|
| 400 | 후보가 없거나 시간 범위·중복이 잘못됨 |
| 401 | 인증 실패 |
| 403 | 활성 합주 공간 멤버가 아님 |
| 404 | 합주 공간 없음 |

---

## GET /schedule-polls/{schedulePollId}

**설명:** 후보별 득표수, 투표자 목록, 내 선택과 추천 후보를 조회한다.

**인증:** 필요 (JWT Bearer)

**권한:** 해당 투표가 속한 활성 합주 공간 멤버

### Response 200

```json
{
  "status": "success",
  "error": null,
  "message": "일정 조율 투표 조회 성공",
  "data": {
    "schedulePollId": "poll-uuid",
    "bandSpaceId": "space-uuid",
    "createdByBandMemberId": "member-uuid",
    "voterCount": 2,
    "options": [
      {
        "schedulePollOptionId": "option-uuid",
        "startAt": "2026-09-13T12:00:00.000Z",
        "endAt": "2026-09-13T14:00:00.000Z",
        "voteCount": 2,
        "isRecommended": true,
        "voters": [
          {
            "bandMemberId": "member-uuid",
            "userId": "user-uuid",
            "nickname": "준혁",
            "avatarUrl": null
          }
        ]
      }
    ],
    "myOptionIds": ["option-uuid"],
    "createdAt": "2026-09-07T00:00:00.000Z",
    "updatedAt": "2026-09-07T00:00:00.000Z"
  }
}
```

- `voterCount`는 두 개 이상의 후보를 골라도 한 명으로 집계한다.
- 가장 많은 표를 받은 후보의 `isRecommended`가 `true`다.
- 모든 후보가 0표이면 추천 후보가 없으며, 최다 득표가 동률이면 모두 추천한다.

### Error Responses

| 코드 | 조건 |
|---|---|
| 401 | 인증 실패 |
| 403 | 활성 합주 공간 멤버가 아님 |
| 404 | 일정 조율 투표 없음 |

---

## PUT /schedule-polls/{schedulePollId}/votes/me

**설명:** 인증 멤버의 후보 선택을 전량 교체한다.

**인증:** 필요 (JWT Bearer)

**권한:** 해당 투표가 속한 활성 합주 공간 멤버

### Request

```json
{
  "schedulePollOptionIds": ["option-uuid-1", "option-uuid-2"]
}
```

- 빈 배열을 전달하면 기존 투표를 철회한다.
- 중복된 후보 ID나 다른 일정 투표의 후보 ID를 전달할 수 없다.

### Response 200

투표 반영 후 응답은 `GET /schedule-polls/{schedulePollId}`의 `data`와 같다.

### Error Responses

| 코드 | 조건 |
|---|---|
| 400 | 중복 후보 또는 다른 투표의 후보가 포함됨 |
| 401 | 인증 실패 |
| 403 | 활성 합주 공간 멤버가 아님 |
| 404 | 일정 조율 투표 없음 |
