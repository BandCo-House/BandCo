# 알림 API 명세

인증된 유저의 알림 목록 조회, 읽음 처리, 삭제 도메인을 정리한다.

> 최초 작성: 2026-07-05 [코드 기반 신규 작성]
>
> ⚠️ 변환 노트:
> - Notion "알림 관리" 데이터베이스에 대응하는 로컬 문서가 없어 `src/modules/notifications/notifications.controller.ts`, `notifications.service.ts` 코드를 1차 소스로 신규 작성.
> - 컨트롤러 전체에 `AccessTokenGuard`가 적용되어 있어 모든 엔드포인트는 인증이 필요하다.
> - `NotificationType` enum 값(`prisma/schema.prisma` 기준): `INVITE`, `NOTICE`, `REMINDER`.

## type·targetPath 규칙

`type`은 프론트 알림 탭을 가르고, `INVITE`는 프론트에서 **수락/거절할 초대장**으로 다뤄져
카드에 수락 버튼이 붙는다. 그래서 실제 초대장이 아닌 통지에 `INVITE`를 쓰면 안 된다.
`targetPath`는 프론트 라우트여야 하며, 대응하는 화면이 없으면 **넣지 않는다**(넣으면 not-found).

| 이벤트 | 생성 위치 | type | targetPath |
|--------|-----------|------|------------|
| 밴드 초대 수신 | `bands.service.ts` `createBandInvitation` | `INVITE` | `/invitations/received?invitationId={invitationId}` |
| 밴드 가입 요청 수신 | `createBandJoinRequest` | `NOTICE` | 없음 — 가입 요청 관리 화면 미구현 |
| 가입 요청 승인 | `approveBandJoinRequest` | `NOTICE` | `/band/{bandId}` |
| 가입 요청 거절 | `rejectBandJoinRequest` | `NOTICE` | 없음 — 보낸 가입 요청 화면 미구현 |
| 초대 수락 통지 | `acceptBandInvitation` | `NOTICE` | `/band/{bandId}` |
| 초대 거절 통지 | `declineBandInvitation` | `NOTICE` | 없음 — 보낸 초대 화면 미구현 |
| 합주 공간 생성·멤버 추가·역할 변경 | `bandspaces.service.ts` | `NOTICE` | `/band/{bandId}/space/{spaceId}` |
| 합주 공간 멤버 제거 | `removeBandSpaceMember` | `NOTICE` | 없음 |
| 합주 일정 생성 | `schedules.service.ts` `createSchedule` | `NOTICE` | `/band/{bandId}/space/{bandSpaceId}` — 일정 상세 라우트 미구현 |
| 합주 일정 삭제 | `deleteSchedule` | `NOTICE` | 없음 |

> 초대 수신 알림의 `targetPath`는 프론트가 `invitationId`를 파싱하는 경로다(`resolveInviteId`).
> `INVITE`는 카드에서 수락/거절을 처리하고 화면 이동을 하지 않으므로 라우트가 아니어도 된다.

---

## API 목록

| 번호 | 메서드 | 경로 | 설명 |
|------|--------|------|------|
| #44 | GET | `/notifications/me` | 알림 목록 조회 |
| - | GET | `/notifications/unread-summary` | 타입별 미읽음 개수 조회 |
| #45 | PATCH | `/notifications/:notificationId/read` | 단건 알림 읽음 처리 |
| #46 | PATCH | `/notifications/read-all` | 전체 알림 읽음 처리 |
| #47 | PATCH | `/notifications/read` | 다건 알림 읽음 처리 |
| #49 | DELETE | `/notifications/:notificationId` | 단건 알림 삭제 |
| #50 | DELETE | `/notifications` | 다건 알림 삭제 |

---

## 타입별 미읽음 개수 조회

- Method: `GET`
- Path: `/notifications/unread-summary`
- 인증: AccessToken

### Response 200

```json
{
  "status": "success",
  "error": null,
  "message": "읽지 않은 알림 개수 조회 성공",
  "data": {
    "unreadCount": 4,
    "unreadByType": {
      "NOTICE": 1,
      "INVITE": 2,
      "REMINDER": 1
    }
  }
}
```

읽지 않은 알림이 없는 타입도 값 `0`으로 포함한다.

### Error

| 코드 | 사유 |
|------|------|
| 401 | 인증 실패 |

---

## #44 알림 목록 조회

- Method: `GET`
- Path: `/notifications/me`
- 인증: AccessToken

### Query Parameters

| 이름 | 필수 | 설명 |
|------|------|------|
| `where__is_read` | N | 읽음 여부 필터 (boolean) |
| `where__type` | N | 알림 타입 필터 (`NotificationType` enum) |
| `order__created_at` | N | 생성일 정렬 (`asc` / `desc`, 기본값: `desc`) |
| `order__id` | N | ID 정렬 (`asc` / `desc`, 기본값: `desc`) |
| `take` | N | 가져올 항목 수 (기본값: 20) |
| `cursor__id` | N | 커서 ID (UUID) |

### Response 200

```json
{
  "success": true,
  "message": "알림 목록 조회 성공",
  "data": {
    "items": [
      {
        "notificationId": "uuid",
        "type": "INVITE",
        "title": "밴드 초대가 도착했습니다.",
        "description": "김민준님이 합주하자 밴드에 초대했습니다.",
        "isRead": false,
        "targetPath": "/invitations/received?invitationId=uuid",
        "createdAt": "2026-07-05T00:00:00.000Z"
      }
    ],
    "meta": {
      "count": 1,
      "take": 20,
      "next": null
    }
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 401 | 인증 실패 |

---

## #45 단건 알림 읽음 처리

- Method: `PATCH`
- Path: `/notifications/:notificationId/read`
- 인증: AccessToken

### Path Parameters

| 이름 | 설명 |
|------|------|
| `notificationId` | 알림 ID (UUID) |

### Response 200

```json
{
  "success": true,
  "message": "알림 읽음 처리 성공",
  "data": {
    "notificationId": "uuid",
    "type": "INVITE",
    "title": "밴드 초대가 도착했습니다.",
    "description": "김민준님이 합주하자 밴드에 초대했습니다.",
    "isRead": true,
    "targetPath": "/invitations/received?invitationId=uuid",
    "createdAt": "2026-07-05T00:00:00.000Z"
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 401 | 인증 실패 |
| 404 | 알림을 찾을 수 없음 |

---

## #46 전체 알림 읽음 처리

- Method: `PATCH`
- Path: `/notifications/read-all`
- 인증: AccessToken

### Response 200

```json
{
  "success": true,
  "message": "전체 알림 읽음 처리 성공",
  "data": {
    "updatedCount": 5
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 401 | 인증 실패 |

---

## #47 다건 알림 읽음 처리

- Method: `PATCH`
- Path: `/notifications/read`
- 인증: AccessToken

### Request Body

```json
{
  "notificationIds": ["uuid"]
}
```

### Response 200

```json
{
  "success": true,
  "message": "다건 알림 읽음 처리 성공",
  "data": {
    "updatedCount": 1,
    "notificationIds": ["uuid"]
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `notificationIds`가 UUID 배열이 아님 |
| 401 | 인증 실패 |

---

## #49 단건 알림 삭제

- Method: `DELETE`
- Path: `/notifications/:notificationId`
- 인증: AccessToken

### Path Parameters

| 이름 | 설명 |
|------|------|
| `notificationId` | 알림 ID (UUID) |

### Response 200

```json
{
  "success": true,
  "message": "알림 삭제 성공",
  "data": {
    "notificationId": "uuid"
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 401 | 인증 실패 |
| 404 | 알림을 찾을 수 없음 |

---

## #50 다건 알림 삭제

- Method: `DELETE`
- Path: `/notifications`
- 인증: AccessToken

### Request Body

```json
{
  "notificationIds": ["uuid"]
}
```

### Response 200

```json
{
  "success": true,
  "message": "다건 알림 삭제 성공",
  "data": {
    "deletedCount": 1,
    "notificationIds": ["uuid"]
  }
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `notificationIds`가 UUID 배열이 아님 |
| 401 | 인증 실패 |
