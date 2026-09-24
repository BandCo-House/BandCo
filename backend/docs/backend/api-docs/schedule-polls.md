# 일정 조율 투표 API

> 코드 기반 신규 명세: 2026-09-07
>
> MVP 범위는 후보 시간 생성, 목록 조회, 멤버별 투표, 후보별 집계 및 투표자 조회, 삭제다. 기존 일정 분석, 실제 일정 생성, 알림은 포함하지 않는다.
>
> ⚠️ 변환 노트: [2026-09-24] 투표 이름(`name`)·마감 기한(`closesAt`) 추가. 마감 이후에는 투표 등록·수정이 400으로 거부된다(조회·삭제는 허용).

## POST /bandspaces/{bandSpaceId}/schedule-polls

**설명:** 합주 공간에 일정 조율 투표를 생성한다.

**인증:** 필요 (JWT Bearer)

**권한:** 합주 공간이 속한 밴드의 멤버

### Request

```json
{
  "name": "좋은 날 오프닝 연습",
  "closesAt": "2026-10-05T19:00:00+09:00",
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

- `name`은 1~50자 문자열이다.
- `closesAt`은 ISO 8601 일시이며 현재 시각 이후여야 한다.
- 후보 시간은 1~20개여야 한다.
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
    "name": "좋은 날 오프닝 연습",
    "closesAt": "2026-10-05T10:00:00.000Z",
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
| 400 | 이름·마감 기한이 잘못됨(빈 값, 과거 마감), 후보가 없거나 20개를 넘음, 시간 범위·중복이 잘못됨 |
| 401 | 인증 실패 |
| 403 | 합주 공간이 속한 밴드의 멤버가 아님 |
| 404 | 합주 공간 없음 |

---

## GET /bandspaces/{bandSpaceId}/schedule-polls

**설명:** 합주 공간의 일정 조율 투표 목록을 최신 생성순으로 조회한다.

**인증:** 필요 (JWT Bearer)

**권한:** 합주 공간이 속한 밴드의 멤버

### Response 200

```json
{
  "status": "success",
  "error": null,
  "message": "일정 조율 투표 목록 조회 성공",
  "data": {
    "items": [
      {
        "schedulePollId": "poll-uuid",
        "bandSpaceId": "space-uuid",
        "createdByBandMemberId": "member-uuid",
        "name": "좋은 날 오프닝 연습",
        "closesAt": "2026-10-05T10:00:00.000Z",
        "optionStartAts": [
          "2026-09-13T12:00:00.000Z",
          "2026-09-14T12:00:00.000Z",
          "2026-09-15T12:00:00.000Z"
        ],
        "optionCount": 3,
        "voterCount": 2,
        "hasVoted": true,
        "createdAt": "2026-09-07T00:00:00.000Z",
        "updatedAt": "2026-09-07T00:00:00.000Z"
      }
    ]
  }
}
```

- 공간당 투표 수가 많지 않아 페이지네이션 없이 전체를 반환한다.
- `voterCount`는 한 명이 여러 후보를 골라도 한 명으로 센다.
- `hasVoted`는 요청자가 한 후보 이상 선택했는지를 나타낸다.
- `optionStartAts`는 후보 시작 시각(시작 오름차순)이다. 목록 카드가 상세 조회 없이 날짜 구간을 그릴 수 있게 한다(후보는 최대 20개라 크기가 유한하다).

### Error Responses

| 코드 | 조건 |
|---|---|
| 401 | 인증 실패 |
| 403 | 합주 공간이 속한 밴드의 멤버가 아님 |
| 404 | 합주 공간 없음 |

---

## GET /schedule-polls/{schedulePollId}

**설명:** 후보별 득표수, 투표자 목록, 내 선택과 추천 후보를 조회한다.

**인증:** 필요 (JWT Bearer)

**권한:** 투표가 속한 합주 공간의 밴드 멤버

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
    "name": "좋은 날 오프닝 연습",
    "closesAt": "2026-10-05T10:00:00.000Z",
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
- `createdByBandMemberId`는 생성자가 밴드를 떠나면 `null`이다. 투표와 다른 멤버의 선택은 유지된다.
- 가장 많은 표를 받은 후보의 `isRecommended`가 `true`다.
- 모든 후보가 0표이면 추천 후보가 없으며, 최다 득표가 동률이면 모두 추천한다.

### Error Responses

| 코드 | 조건 |
|---|---|
| 401 | 인증 실패 |
| 403 | 합주 공간이 속한 밴드의 멤버가 아님 |
| 404 | 일정 조율 투표 없음 |

---

## PUT /schedule-polls/{schedulePollId}/votes/me

**설명:** 인증 멤버의 후보 선택을 전량 교체한다.

**인증:** 필요 (JWT Bearer)

**권한:** 투표가 속한 합주 공간의 밴드 멤버

### Request

```json
{
  "schedulePollOptionIds": ["option-uuid-1", "option-uuid-2"]
}
```

- 빈 배열을 전달하면 기존 투표를 철회한다.
- 중복된 후보 ID나 다른 일정 투표의 후보 ID를 전달할 수 없다.
- 최대 20개까지 전달할 수 있다.
- 같은 멤버의 요청이 동시에 들어오면 순서대로 처리되며, 마지막으로 처리된 요청의 선택이 남는다.
- `closesAt`이 지난 투표에는 등록·수정·철회 모두 불가하다(400).

### Response 200

투표 반영 후 응답은 `GET /schedule-polls/{schedulePollId}`의 `data`와 같다.

### Error Responses

| 코드 | 조건 |
|---|---|
| 400 | 마감된 투표, 중복 후보 또는 다른 투표의 후보가 포함됨, 20개를 넘음 |
| 401 | 인증 실패 |
| 403 | 합주 공간이 속한 밴드의 멤버가 아님 |
| 404 | 일정 조율 투표 없음 |

---

## DELETE /schedule-polls/{schedulePollId}

**설명:** 일정 조율 투표를 삭제한다. 후보 시간과 멤버 선택도 함께 삭제된다.

**인증:** 필요 (JWT Bearer)

**권한:** 투표 생성자 또는 밴드 리더(BM)·부리더(ADMIN)

### Response 200

```json
{
  "status": "success",
  "error": null,
  "message": "일정 조율 투표 삭제 성공",
  "data": {
    "schedulePollId": "poll-uuid"
  }
}
```

- 생성자가 밴드를 떠난 투표는 리더·부리더만 삭제할 수 있다.

### Error Responses

| 코드 | 조건 |
|---|---|
| 401 | 인증 실패 |
| 403 | 합주 공간이 속한 밴드의 멤버가 아니거나, 생성자·리더·부리더가 아님 |
| 404 | 일정 조율 투표 없음 |
