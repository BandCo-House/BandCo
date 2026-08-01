# 밴드 초대 링크 API

밴드 운영자가 초대 코드를 발급·재발급·폐기하고, 인증 사용자가 유효한 코드로 밴드에 가입하는 API를 정리한다.

> 최초 작성: 2026-07-28
>
> 기존 통합 명세의 `#51 밴드 초대 링크 생성`은 정책이 정해지지 않은 채 MVP 제외로 남아 있었다. 이번 구현에서 권한, 가입 방식, 만료, 재사용, 재발급, 폐기 정책을 확정했다.

## 정책

- `BM`과 `ADMIN`만 링크를 발급·재발급·폐기할 수 있다.
- 링크 발급은 가입을 미리 승인한 것으로 보며, 유효한 코드를 사용한 인증 사용자는 즉시 `MEMBER`가 된다.
- 공개·비공개 밴드 모두 링크 가입을 허용한다.
- 밴드에서 차단된 사용자는 링크로 가입할 수 없다.
- 링크는 발급 후 7일 동안 여러 사용자가 재사용할 수 있다.
- 밴드마다 링크를 하나만 유지하며, 재발급하면 기존 코드는 즉시 무효화된다.
- 원본 코드는 발급 응답에서 한 번만 반환하고 DB에는 SHA-256 해시를 저장한다.

## API 목록

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/bands/:bandId/invite-link` | 초대 링크 발급·재발급 |
| DELETE | `/bands/:bandId/invite-link` | 초대 링크 폐기 |
| POST | `/invite-links/:code/join` | 초대 코드로 밴드 가입 |

---

## 초대 링크 발급·재발급

- Method: `POST`
- Path: `/bands/:bandId/invite-link`
- 인증: AccessToken
- 권한: `BM`, `ADMIN`
- Request Body: 없음

### Path Parameters

| 이름 | 타입 | 설명 |
|------|------|------|
| `bandId` | UUID | 대상 밴드 ID |

### Response 201

```json
{
  "success": true,
  "message": "밴드 초대 링크를 발급했습니다.",
  "data": {
    "bandId": "uuid",
    "inviteCode": "7KQ2M9ABCD3FE8NP",
    "expiredAt": "2026-08-04T00:00:00.000Z"
  }
}
```

`inviteCode`는 이 응답에서만 확인할 수 있다. 프론트엔드는 `${window.location.origin}/invite-links/${inviteCode}` 형태로 링크를 만든다.

### Error

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |
| 403 | 밴드 멤버가 아니거나 `MEMBER` 역할 |
| 404 | 삭제되지 않은 밴드를 찾을 수 없음 |

---

## 초대 링크 폐기

- Method: `DELETE`
- Path: `/bands/:bandId/invite-link`
- 인증: AccessToken
- 권한: `BM`, `ADMIN`

### Response 200

```json
{
  "success": true,
  "message": "밴드 초대 링크를 폐기했습니다.",
  "data": {
    "bandId": "uuid",
    "revokedAt": "2026-07-28T00:00:00.000Z"
  }
}
```

### Error

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |
| 403 | 밴드 멤버가 아니거나 `MEMBER` 역할 |
| 404 | 밴드 또는 폐기할 링크를 찾을 수 없음 |

---

## 초대 코드로 밴드 가입

- Method: `POST`
- Path: `/invite-links/:code/join`
- 인증: AccessToken
- Request Body: 없음

### Path Parameters

| 이름 | 타입 | 설명 |
|------|------|------|
| `code` | string | 발급받은 16자리 초대 코드 |

코드는 앞뒤 공백을 제거하고 대문자로 변환한 뒤 검증한다.

### Response 201

```json
{
  "success": true,
  "message": "밴드에 가입했습니다.",
  "data": {
    "bandId": "uuid",
    "userId": "uuid",
    "memberId": "uuid",
    "joinedAt": "2026-07-28T00:00:00.000Z"
  }
}
```

가입에 성공하면 같은 밴드·사용자의 대기 중 직접 초대와 가입 요청을 함께 삭제한다.

### Error

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |
| 403 | 밴드에서 차단된 사용자 |
| 404 | 코드가 없거나 링크가 만료·폐기됐거나 밴드가 삭제됨 |
| 409 | 이미 밴드 멤버 |
