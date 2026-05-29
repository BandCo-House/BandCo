# 합주 공간 관리 API 명세

Notion API 명세서의 `합주 공간 관리` 도메인을 기준으로 정리한다.

> ⚠️ 변환 노트: [설계자 보완 2026-05-29]
> - 에러 응답(401/403/404) 누락 → 표준 컨벤션 기반 보완
> - #28: 명세는 cursor 기반 pagination이나 현재 구현은 page/size 기반 → 미결 사항 (design.md 참고)
> - #29: MVP에서 team 도메인 제외 → `teams` 배열 응답에서 제거 (2026-05-29)
> - #30: 명세는 `userId`를 받으나 현재 구현은 `bandMemberId` 사용 → 미결 사항 (design.md 참고)
> - 권한 검증 기준 없음 → 미결 사항 (design.md 참고)

## API 목록

| 번호 | 메서드 | 경로 | 설명 |
|------|--------|------|------|
| #28 | GET | `/bands/{bandId}/bandspaces` | 합주 공간 목록 조회 |
| #29 | GET | `/bandspaces/{bandspaceId}` | 합주 공간 상세 조회 |
| #30 | POST | `/bandspaces/{bandspaceId}/members` | 합주 공간 멤버 추가 |
| #31 | PATCH | `/bandspaces/{bandspaceId}/members/{memberId}` | 합주 공간 멤버 역할 수정 |
| #32 | DELETE | `/bandspaces/{bandspaceId}/members/{memberId}` | 합주 공간 멤버 제거 |
| #33 | POST | `/bands/{bandId}/bandspaces` | 합주 공간 생성 |
| #57 | PATCH | `/bandspaces/{bandspaceId}` | 합주 공간 수정 |
| #58 | DELETE | `/bandspaces/{bandspaceId}` | 합주 공간 삭제 |

## #28 합주 공간 목록 조회

- Method: `GET`
- Path: `/bands/{bandId}/bandspaces`

> ⚠️ 미결: 명세는 cursor 기반 pagination(`take`, `cursor`, `next`)이나 현재 구현은 page/size 기반. 어느 쪽을 기준으로 할지 확인 필요.

### Query Parameters

| 이름 | 필수 | 설명 |
|------|------|------|
| `take` | Y | 가져올 합주 공간 개수 |
| `order__created_at` | Y | 생성일 정렬. `ASC` 또는 `DESC` |
| `where__name__contains` | N | 합주 공간 이름 검색 |

### Response

```json
{
  "status": "success",
  "error": null,
  "message": "합주 공간 목록 조회 성공",
  "data": {
    "items": [
      {
        "spaceId": "space-uuid",
        "bandId": "band-uuid",
        "createdByUserId": "user-uuid",
        "name": "2026 하계공연 준비",
        "description": "여름 축제 공연 준비 공간",
        "spaceType": "STUDIO",
        "status": "ACTIVE",
        "startDate": "2026-07-01",
        "endDate": "2026-08-20",
        "memberCount": 10,
        "songCount": 12,
        "isMine": true,
        "myMembership": {
          "isMember": true,
          "role": "LEADER"
        },
        "createdAt": "2026-04-30T14:16:00.000+09:00",
        "updatedAt": "2026-04-30T14:16:00.000+09:00"
      }
    ],
    "meta": {
      "count": 1,
      "take": 20,
      "cursor": {
        "createdAt": "2026-04-30T14:16:00.000+09:00",
        "id": "space-uuid"
      },
      "next": null
    }
  }
}
```

### Error Responses

| 상태 코드 | 사유 |
|-----------|------|
| 401 | 인증되지 않은 요청 |
| 403 | 해당 밴드의 멤버가 아님 |
| 404 | 밴드를 찾을 수 없음 |

## #29 합주 공간 상세 조회

- Method: `GET`
- Path: `/bandspaces/{bandspaceId}`

> ℹ️ MVP 범위: team 도메인 모듈 제외로 `teams` 배열 응답에서 제거됨 (2026-05-29)

### Response

```json
{
  "status": "success",
  "error": null,
  "message": "합주 공간 상세 조회 성공",
  "data": {
    "space": {
      "spaceId": "space-uuid",
      "bandId": "band-uuid",
      "name": "2026 하계공연 준비",
      "description": "여름 축제 공연 준비 공간",
      "spaceType": "STUDIO",
      "status": "ACTIVE",
      "startDate": "2026-07-01",
      "endDate": "2026-08-20",
      "createdAt": "2026-04-30T14:16:00.000+09:00",
      "updatedAt": "2026-04-30T14:16:00.000+09:00"
    },
    "members": [
      {
        "memberId": "space-member-uuid",
        "userId": "user-uuid",
        "nickname": "김민준",
        "role": "LEADER",
        "status": "ACTIVE",
        "joinedAt": "2026-04-30T14:17:00.000+09:00"
      }
    ],
    "songCount": 12,
    "scheduleCount": 3
  }
}
```

### Error Responses

| 상태 코드 | 사유 |
|-----------|------|
| 401 | 인증되지 않은 요청 |
| 403 | 해당 합주 공간의 멤버가 아님 |
| 404 | 합주 공간을 찾을 수 없음 |

## #30 합주 공간 멤버 추가

> ⚠️ 미결: 명세는 `userId`를 받으나 현재 구현은 `bandMemberId` 사용. 어느 것이 맞는지 확인 필요.

- Method: `POST`
- Path: `/bandspaces/{bandspaceId}/members`

### Request

```json
{
  "userId": "uuid",
  "role": "MEMBER"
}
```

### Response

```json
{
  "status": "success",
  "error": null,
  "message": "합주 공간 멤버 추가 성공",
  "data": {
    "memberId": "space-member-uuid",
    "spaceId": "space-uuid",
    "userId": "user-uuid",
    "bandMemberId": "band-member-uuid",
    "role": "MEMBER",
    "status": "ACTIVE",
    "joinedAt": "2026-04-30T14:20:00.000+09:00"
  }
}
```

### Error Responses

| 상태 코드 | 사유 |
|-----------|------|
| 400 | 이미 합주 공간에 참여 중인 멤버 |
| 401 | 인증되지 않은 요청 |
| 403 | 권한 없음 |
| 404 | 합주 공간 또는 사용자를 찾을 수 없음 |

## #31 합주 공간 멤버 역할 수정

- Method: `PATCH`
- Path: `/bandspaces/{bandspaceId}/members/{memberId}`

### Request

```json
{
  "role": "LEADER"
}
```

### Response

```json
{
  "status": "success",
  "error": null,
  "message": "합주 공간 멤버 역할 수정 성공",
  "data": {
    "memberId": "space-member-uuid",
    "spaceId": "space-uuid",
    "userId": "user-uuid",
    "bandMemberId": "band-member-uuid",
    "role": "LEADER",
    "updatedAt": "2026-04-30T14:25:00.000+09:00"
  }
}
```

### Error Responses

| 상태 코드 | 사유 |
|-----------|------|
| 401 | 인증되지 않은 요청 |
| 403 | 권한 없음 |
| 404 | 합주 공간 또는 멤버를 찾을 수 없음 |

## #32 합주 공간 멤버 제거

- Method: `DELETE`
- Path: `/bandspaces/{bandspaceId}/members/{memberId}`

### Response

```json
{
  "status": "success",
  "error": null,
  "message": "합주 공간 멤버 제거 성공",
  "data": {
    "memberId": "space-member-uuid",
    "spaceId": "space-uuid",
    "removedAt": "2026-04-30T14:27:00.000+09:00"
  }
}
```

### Error Responses

| 상태 코드 | 사유 |
|-----------|------|
| 401 | 인증되지 않은 요청 |
| 403 | 권한 없음 |
| 404 | 합주 공간 또는 멤버를 찾을 수 없음 |

## #33 합주 공간 생성

- Method: `POST`
- Path: `/bands/{bandId}/bandspaces`

### Request

```json
{
  "name": "2026 하계공연 준비",
  "description": "여름 축제 공연 준비 공간",
  "spaceType": "STUDIO",
  "status": "ACTIVE",
  "startDate": "2026-07-01",
  "endDate": "2026-08-20"
}
```

### Response

```json
{
  "status": "success",
  "error": null,
  "message": "합주 공간 생성 성공",
  "data": {
    "spaceId": "space-uuid",
    "bandId": "band-uuid",
    "name": "2026 하계공연 준비",
    "description": "여름 축제 공연 준비 공간",
    "spaceType": "STUDIO",
    "status": "ACTIVE",
    "startDate": "2026-07-01",
    "endDate": "2026-08-20",
    "createdByUserId": "user-uuid",
    "createdAt": "2026-04-30T14:16:00.000+09:00"
  }
}
```

### Error Responses

| 상태 코드 | 사유 |
|-----------|------|
| 401 | 인증되지 않은 요청 |
| 403 | 해당 밴드의 멤버가 아님 |
| 404 | 밴드를 찾을 수 없음 |

## #57 합주 공간 수정

- Method: `PATCH`
- Path: `/bandspaces/{bandspaceId}`

### Request

```json
{
  "name": "2026 하계공연 최종 준비",
  "description": "하계공연 최종 리허설 공간",
  "spaceType": "STUDIO",
  "status": "ACTIVE",
  "startDate": "2026-07-01",
  "endDate": "2026-08-20"
}
```

### Response

```json
{
  "status": "success",
  "error": null,
  "message": "합주 공간 수정 성공",
  "data": {
    "spaceId": "space-uuid",
    "bandId": "band-uuid",
    "name": "2026 하계공연 최종 준비",
    "description": "하계공연 최종 리허설 공간",
    "spaceType": "STUDIO",
    "status": "ACTIVE",
    "startDate": "2026-07-01",
    "endDate": "2026-08-20",
    "updatedAt": "2026-04-30T14:30:00.000+09:00"
  }
}
```

### Error Responses

| 상태 코드 | 사유 |
|-----------|------|
| 401 | 인증되지 않은 요청 |
| 403 | 권한 없음 |
| 404 | 합주 공간을 찾을 수 없음 |

## #58 합주 공간 삭제

- Method: `DELETE`
- Path: `/bandspaces/{bandspaceId}`

### Response

```json
{
  "status": "success",
  "error": null,
  "message": "합주 공간 삭제 성공",
  "data": {
    "spaceId": "space-uuid",
    "deletedAt": "2026-04-30T14:35:00.000+09:00"
  }
}
```

### Error Responses

| 상태 코드 | 사유 |
|-----------|------|
| 401 | 인증되지 않은 요청 |
| 403 | 권한 없음 |
| 404 | 합주 공간을 찾을 수 없음 |
