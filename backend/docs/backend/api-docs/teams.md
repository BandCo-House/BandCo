# teams API

> 최종 동기화: 2026-06-28
>
> ⚠️ 변환 노트: [설계자 보완 2026-09-06] 팀 세션 편성 추가 — `POST /teams/{teamId}/members` 요청에 `skillTypeId?` 추가(같은 멤버를 다른 세션으로 여러 번 추가 가능), 팀 멤버 응답에 `skillType: { skillTypeId, name } | null` 추가. 기존 `skills`(개인 보유 스킬)와 다른 값이다. `#67 PATCH /teams/{teamId}/members/{teamMemberId}` 신규 추가 — 세션 변경을 제거+재추가가 아니라 UPDATE로 처리한다.

---

## #53 POST /bands/{bandId}/teams

**설명:** 밴드 내에 새 팀을 생성한다. 생성자가 자동으로 팀 리더가 된다.
**인증:** 필요 (JWT Bearer)
**권한:** 밴드 멤버

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 팀을 생성할 밴드 ID |

**Body**

```json
{
  "name": "보컬팀",
  "description": "여자 보컬 중심 팀",
  "teamCoverUrl": "https://example.com/images/team-cover.png"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| name | string | ✅ | 팀 이름 |
| description | string | ❌ | 팀 설명 |
| teamCoverUrl | string (URL) | ❌ | 팀 커버 이미지 URL |

### Response 201

```json
{
  "data": {
    "teamId": "uuid",
    "bandId": "uuid",
    "name": "보컬팀",
    "description": "여자 보컬 중심 팀",
    "status": "ACTIVE",
    "teamLeaderUserId": "uuid",
    "teamCoverUrl": "https://example.com/team-cover.png",
    "createdAt": "2026-05-01T12:00:00Z"
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | 잘못된 입력 (name 누락 등) |
| 401 | 인증 실패 |
| 403 | 해당 밴드의 멤버가 아님 |
| 404 | 밴드 없음 |

---

## #54 GET /bands/{bandId}/teams

**설명:** 밴드에 속한 모든 팀 목록을 조회한다.
**인증:** 불필요 (공개)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 조회할 밴드 ID |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| take | number | ❌ | 20 | 페이지당 항목 수 |
| order__created_at | string | ❌ | desc | createdAt 정렬 방향 (asc / desc) |
| order__id | string | ❌ | desc | id 정렬 방향 (asc / desc) |
| cursor__created_at | string (ISO8601) | ❌ | - | 커서 createdAt |
| cursor__id | string (UUID) | ❌ | - | 커서 ID |

### Response 200

```json
{
  "data": {
    "bandId": "uuid",
    "items": [
      {
        "teamId": "uuid",
        "name": "보컬팀",
        "description": "여자 보컬 중심 팀",
        "status": "ACTIVE",
        "teamCoverUrl": "https://example.com/team-cover.png",
        "memberCount": 3,
        "teamLeader": {
          "userId": "uuid",
          "nickname": "Jun"
        },
        "createdAt": "2026-05-01T12:00:00Z"
      }
    ],
    "meta": {
      "count": 20,
      "take": 20,
      "cursor": {
        "createdAt": "2026-05-01T12:00:00Z",
        "id": "last-team-id"
      },
      "next": "/bands/uuid/teams?take=20&cursor__created_at=2026-05-01T12%3A00%3A00Z&cursor__id=last-team-id&order__created_at=desc&order__id=desc"
    }
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | bandId가 UUID 형식이 아님 |
| 404 | 밴드 없음 |

---

## #55 GET /teams/me

**설명:** 내가 속해 있는 팀 목록을 조회한다.
**인증:** 필요 (JWT Bearer)

### Request

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| take | number | ❌ | 20 | 페이지당 항목 수 |
| order__joined_at | string | ❌ | desc | joinedAt 정렬 방향 (asc / desc) |
| order__id | string | ❌ | desc | id 정렬 방향 (asc / desc) |
| cursor__joined_at | string (ISO8601) | ❌ | - | 커서 joinedAt |
| cursor__id | string (UUID) | ❌ | - | 커서 ID |

### Response 200

```json
{
  "data": {
    "items": [
      {
        "teamId": "uuid",
        "bandId": "uuid",
        "bandName": "Rocking Stars",
        "name": "보컬팀",
        "description": "여자 보컬 중심 팀",
        "status": "ACTIVE",
        "teamCoverUrl": "https://example.com/team-cover.png",
        "myTeamRole": "LEADER",
        "memberCount": 3,
        "teamLeader": {
          "userId": "uuid",
          "nickname": "Jun"
        },
        "joinedAt": "2026-05-01T12:00:00Z",
        "createdAt": "2026-05-01T12:00:00Z"
      }
    ],
    "meta": {
      "count": 20,
      "take": 20,
      "cursor": {
        "joinedAt": "2026-05-01T12:00:00Z",
        "id": "last-team-member-id"
      },
      "next": "/teams/me?take=20&cursor__joined_at=2026-05-01T12%3A00%3A00Z&cursor__id=last-team-member-id&order__joined_at=desc&order__id=desc"
    }
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 401 | 인증 실패 |

---

## #60 GET /teams/{teamId}

**설명:** 팀 상세 정보를 조회한다.
**인증:** 불필요 (공개)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| teamId | string (UUID) | ✅ | 조회할 팀 ID |

### Response 200

```json
{
  "data": {
    "teamId": "uuid",
    "bandId": "uuid",
    "name": "보컬팀",
    "description": "여자 보컬 중심 팀",
    "status": "ACTIVE",
    "teamCoverUrl": "https://example.com/team-cover.png",
    "teamLeader": {
      "userId": "uuid",
      "nickname": "Jun"
    },
    "memberCount": 3,
    "createdAt": "2026-05-01T12:00:00Z",
    "updatedAt": "2026-05-01T12:00:00Z"
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | teamId가 UUID 형식이 아님 |
| 404 | 팀 없음 |

---

## #61 PATCH /teams/{teamId}

**설명:** 팀 정보를 수정한다. 전달된 필드만 업데이트된다.
**인증:** 필요 (JWT Bearer)
**권한:** 팀 리더 (TeamMemberRole.LEADER)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| teamId | string (UUID) | ✅ | 수정할 팀 ID |

**Body**

모든 필드는 선택. 전달된 필드만 업데이트.

```json
{
  "name": "메인 보컬팀",
  "description": "메인 보컬 중심 팀",
  "status": "ACTIVE",
  "teamCoverUrl": "https://example.com/new-cover.png"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| name | string | ❌ | 팀 이름 |
| description | string | ❌ | 팀 설명 |
| status | string | ❌ | 팀 상태 (ACTIVE \| INACTIVE) |
| teamCoverUrl | string (URL) | ❌ | 팀 커버 이미지 URL |

### Response 200

```json
{
  "data": {
    "teamId": "uuid",
    "bandId": "uuid",
    "name": "메인 보컬팀",
    "description": "메인 보컬 중심 팀",
    "status": "ACTIVE",
    "teamCoverUrl": "https://example.com/new-cover.png",
    "teamLeader": {
      "userId": "uuid",
      "nickname": "Jun"
    },
    "memberCount": 3,
    "updatedAt": "2026-05-01T12:30:00Z"
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | 잘못된 입력 |
| 401 | 인증 실패 |
| 403 | 권한 없음 (팀 리더 아님) |
| 404 | 팀 없음 |

---

## #62 GET /teams/{teamId}/members

**설명:** 팀 멤버 목록을 조회한다.
**인증:** 불필요 (공개)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| teamId | string (UUID) | ✅ | 조회할 팀 ID |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|
| take | number | ❌ | 20 | 페이지당 항목 수 |
| order__joined_at | string | ❌ | desc | joinedAt 정렬 방향 (asc / desc) |
| order__id | string | ❌ | desc | id 정렬 방향 (asc / desc) |
| cursor__joined_at | string (ISO8601) | ❌ | - | 커서 joinedAt |
| cursor__id | string (UUID) | ❌ | - | 커서 ID |

### Response 200

```json
{
  "data": {
    "teamId": "uuid",
    "items": [
      {
        "teamMemberId": "uuid",
        "bandMemberId": "uuid",
        "user": {
          "userId": "uuid",
          "nickname": "Jun",
          "profileImageUrl": "https://example.com/profile.png"
        },
        "teamRole": "LEADER",
        "joinedAt": "2026-05-01T12:00:00Z"
      },
      {
        "teamMemberId": "uuid",
        "bandMemberId": "uuid",
        "user": {
          "userId": "uuid",
          "nickname": "Min",
          "profileImageUrl": "https://example.com/profile2.png"
        },
        "teamRole": "MEMBER",
        "joinedAt": "2026-05-02T12:00:00Z"
      }
    ],
    "meta": {
      "count": 20,
      "take": 20,
      "cursor": {
        "joinedAt": "2026-05-02T12:00:00Z",
        "id": "last-team-member-id"
      },
      "next": "/teams/uuid/members?take=20&cursor__joined_at=2026-05-02T12%3A00%3A00Z&cursor__id=last-team-member-id&order__joined_at=desc&order__id=desc"
    }
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | teamId가 UUID 형식이 아님 |
| 404 | 팀 없음 |

---

## #63 PATCH /teams/{teamId}/leader

**설명:** 팀 리더를 다른 팀 멤버로 변경한다.
**인증:** 필요 (JWT Bearer)
**권한:** 팀 리더 (TeamMemberRole.LEADER)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| teamId | string (UUID) | ✅ | 리더를 변경할 팀 ID |

**Body**

```json
{
  "teamMemberId": "uuid"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| teamMemberId | string (UUID) | ✅ | 새 팀 리더로 지정할 팀 멤버 ID |

### Response 200

```json
{
  "data": {
    "teamId": "uuid",
    "teamLeader": {
      "userId": "uuid",
      "nickname": "NewLeader"
    }
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | teamMemberId가 UUID 형식이 아님 또는 누락 |
| 401 | 인증 실패 |
| 403 | 권한 없음 (팀 리더 아님) |
| 404 | 팀 없음 또는 팀 멤버 없음 |

---

## #64 DELETE /teams/{teamId}/members/{teamMemberId}

**설명:** 팀에서 특정 멤버를 제거한다.
**인증:** 필요 (JWT Bearer)
**권한:** 팀 리더 (TeamMemberRole.LEADER)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| teamId | string (UUID) | ✅ | 팀 ID |
| teamMemberId | string (UUID) | ✅ | 제거할 팀 멤버 ID |

### Response 200

```json
{
  "data": {
    "teamMemberId": "uuid",
    "removed": true
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | teamId 또는 teamMemberId가 UUID 형식이 아님 / 팀 리더는 자기 자신을 제거할 수 없음 (리더 변경 후 제거 가능) |
| 401 | 인증 실패 |
| 403 | 권한 없음 (팀 리더 아님) |
| 404 | 팀 없음 또는 팀 멤버 없음 |

---

## #65 POST /teams/{teamId}/members

**설명:** 팀에 밴드 멤버를 추가한다.
**인증:** 필요 (JWT Bearer)
**권한:** 팀 리더 (TeamMemberRole.LEADER)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| teamId | string (UUID) | ✅ | 팀 ID |

**Body**

```json
{
  "bandMemberId": "uuid"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| bandMemberId | string (UUID) | ✅ | 팀에 추가할 밴드 멤버 ID |

### Response 201

```json
{
  "data": {
    "teamMemberId": "uuid",
    "teamId": "uuid",
    "bandMemberId": "uuid",
    "user": {
      "userId": "uuid",
      "nickname": "Jun",
      "profileImageUrl": "https://example.com/profile.png"
    },
    "teamRole": "MEMBER",
    "joinedAt": "2026-05-01T12:00:00Z"
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | bandMemberId가 UUID 형식이 아님 또는 누락 |
| 401 | 인증 실패 |
| 403 | 권한 없음 (팀 리더 아님) |
| 404 | 팀 없음 또는 밴드 멤버 없음 |
| 409 | 이미 해당 팀의 멤버 |

---

## #66 DELETE /teams/{teamId}

**설명:** 팀을 삭제한다.
**인증:** 필요 (JWT Bearer)
**권한:** 팀 리더 (TeamMemberRole.LEADER)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| teamId | string (UUID) | ✅ | 삭제할 팀 ID |

### Response 200

```json
{
  "data": {
    "teamId": "uuid",
    "deleted": true
  },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | teamId가 UUID 형식이 아님 |
| 401 | 인증 실패 |
| 403 | 권한 없음 (팀 리더 아님) |
| 404 | 팀 없음 |

---

## #67 PATCH /teams/{teamId}/members/{teamMemberId}

팀 멤버 세션 변경. 세션만 바꾸는 건 UPDATE 한 번이면 된다 — 제거 후 재추가로 흉내 내면 중간에 실패했을 때 멀쩡히 있던 사람이 팀에서 빠진다.

### Request

```json
{
  "skillTypeId": "skill-type-uuid"
}
```

> `skillTypeId`를 `null`로 주면 세션 미배정으로 되돌린다. 생략(undefined)과 `null`은 같은 결과다.

### Response 200

```json
{
  "status": "success",
  "error": null,
  "message": "팀 멤버 세션 변경 성공",
  "data": {
    "teamMemberId": "team-member-uuid",
    "teamId": "team-uuid",
    "bandMemberId": "band-member-uuid",
    "user": {
      "userId": "user-uuid",
      "nickname": "김민수",
      "profileImageUrl": null
    },
    "teamRole": "MEMBER",
    "joinedAt": "2026-05-01T12:00:00.000Z",
    "skillType": { "skillTypeId": "skill-type-uuid", "name": "보컬" }
  }
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | 존재하지 않는 세션 |
| 401 | 인증 실패 |
| 403 | 팀 리더 권한 필요 |
| 404 | 팀 또는 팀 멤버를 찾을 수 없음 |
| 409 | 같은 사람이 이미 같은 세션을 맡고 있음 |

---

## PUT /teams/{teamId}/members

팀 명단 일괄 교체. 추가·제거·세션 변경을 한 트랜잭션에서 끝낸다.

단건 API를 여러 번 부르면 DELETE는 성공했는데 POST가 실패하는 순간 사람이 사라진 채로 남는다. 화면은 "저장 실패"만 보여주고 사용자는 팀이 이미 바뀐 걸 모른다. 명단 전체를 받아 서버가 한 번에 맞추면 그 중간 상태가 없어진다.

### Request

```json
{
  "members": [
    { "teamMemberId": "team-member-uuid", "bandMemberId": "band-member-uuid", "skillTypeId": "skill-type-uuid" },
    { "teamMemberId": "team-member-uuid-2", "bandMemberId": "band-member-uuid-2", "skillTypeId": null },
    { "bandMemberId": "band-member-uuid-3" }
  ]
}
```

> `members`는 **교체 후 명단 전체**다. 여기 없는 기존 행은 삭제된다.
>
> `teamMemberId`는 기존 행을 이어받겠다는 표시다. 보내면 그 행의 `joinedAt`·`teamRole`이 유지되고, 생략하면 새 행으로 만들어진다. 같은 `teamMemberId`에 다른 `bandMemberId`를 주면 **사람이 바뀐 것**으로 보고 지우고 새로 만든다 — 다른 사람의 가입일을 물려받지 않게 하기 위해서다.
>
> `skillTypeId`는 생략하거나 `null`이면 미배정이다.

### 처리 규칙

| 요청 행 | 처리 |
|---------|------|
| `teamMemberId` 있음 + 사람·세션 모두 그대로 | 손대지 않음 |
| `teamMemberId` 있음 + 세션만 다름 | 다시 생성 (`joinedAt`·`teamRole` 그대로 이월) |
| `teamMemberId` 있음 + `bandMemberId` 다름 | 다시 생성 (다른 사람이므로 `joinedAt`은 새로 찍힘) |
| `teamMemberId` 없음 | 생성 |
| 기존 행이 `members`에 없음 | 삭제 |

> 세션이 바뀐 행은 `UPDATE`가 아니라 **삭제 후 재생성**이다. `UPDATE`로 옮기면 중간 상태가 `team_members_team_member_no_skill_key`(부분 unique)에 걸린다 — 같은 사람의 행이 잠깐이라도 동시에 `skill_type_id IS NULL`이 되는 순간 위반이다. 한 트랜잭션 안이라 재생성에 따르는 위험은 없고, `joinedAt`·`teamRole`은 그대로 옮긴다. **다만 그 행의 `teamMemberId`는 새로 발급된다.**

### Response 200

```json
{
  "status": "success",
  "error": null,
  "message": "팀 명단 교체 성공",
  "data": {
    "teamId": "team-uuid",
    "members": [
      {
        "teamMemberId": "team-member-uuid",
        "bandMemberId": "band-member-uuid",
        "user": { "userId": "user-uuid", "nickname": "김민수", "profileImageUrl": null },
        "teamRole": "LEADER",
        "joinedAt": "2026-05-01T12:00:00.000Z",
        "skillType": { "skillTypeId": "skill-type-uuid", "name": "보컬" },
        "skills": []
      }
    ]
  }
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | 한 세션에 두 명 / 같은 멤버를 같은 세션에 두 번 / 다른 밴드 멤버 / 존재하지 않는 세션 / 리더를 명단에서 제외 / 이 팀에 없는 `teamMemberId` |
| 401 | 인증 실패 |
| 403 | 팀 리더 권한 필요 |
| 404 | 팀을 찾을 수 없음 |

> **한 세션에는 한 명만.** `@@unique([teamId, bandMemberId, skillTypeId])`는 "같은 사람 + 같은 세션"만 막아서, 다른 사람이 같은 세션을 맡는 건 DB가 통과시킨다. 이 규칙은 서버가 검증한다.
>
> 한 사람이 여러 세션을 겸하는 건 허용한다(보컬 겸 기타). 중복 판정은 사람이 아니라 세션 기준이다.
