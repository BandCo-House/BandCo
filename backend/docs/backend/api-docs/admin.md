# Admin API

> 작성: 2026-10-05 (feat/admin-console). Notion 명세 없이 설계 문서에서 정의했다.
> 운영 절차(시크릿, 첫 계정 생성, 로컬 확인)는 [operations/admin-console.md](../operations/admin-console.md)를 본다.

## 인증과 권한

- 어드민 API(`/admin/*`)는 서비스 유저와 분리된 어드민 계정으로만 호출한다. 헤더는 `Authorization: Bearer <어드민 액세스 토큰>`이다.
- 어드민 토큰은 `ADMIN_JWT_SECRET`으로 서명되고 `scope: 'admin'`을 가진다. 유저 토큰은 어드민 API에서, 어드민 토큰은 유저 API에서 401이다.
- 액세스 토큰 30분, 리프레시 토큰 12시간. 401을 받으면 `POST /admin/auth/token/access`(리프레시 토큰)로 재발급한다.
- 비활성화된 어드민의 기존 토큰은 다음 요청부터 401이다.
- SUPER_ADMIN 전용: `/admin/admins/*`, `PATCH /admin/service-settings`, `POST /admin/notifications/broadcast`. OPERATOR가 호출하면 403 `이 작업을 수행할 권한이 없습니다.`
- 상태 변경 POST(`/withdraw`, `/restore`, `/revoke`, `/resend`, `/invite-link/expire` 등)는 Nest 기본값대로 201을 돌려준다.

## 공통 규칙

- 성공: `{ status: 'success', error: null, message, data }` / 실패: `{ status: 'fail', error: { code: 'NOT_FOUND' 등 }, message, data: {} }`
- 날짜는 ISO 8601 문자열. 목록은 오프셋 페이지네이션.
  - 쿼리 `page`(기본 1), `size`(기본 20, 최대 100)
  - 응답 `{ items: T[], pagination: { page, size, totalCount, hasNext } }`
- 경로의 ID는 UUID(`ParseUUIDPipe`, 버전 미고정). 장르·세션 마스터 데이터는 UUID v5다.
- 대시보드의 "오늘/일자"는 KST(Asia/Seoul) 기준.

## 인증 `/admin/auth`

| 메서드 | 경로 | 권한 | 요청 | 응답 data |
|---|---|---|---|---|
| POST | /admin/auth/login | 없음 | `{ email, password }` | `{ accessToken, refreshToken, admin: AdminProfile }` |
| POST | /admin/auth/token/access | refresh 토큰 | - | `{ accessToken }` |
| GET | /admin/auth/me | access | - | `AdminProfile` |
| PATCH | /admin/auth/me/password | access | `{ currentPassword, newPassword }` (8~72자) | `{ adminId, accessToken, refreshToken }` |

`AdminProfile = { adminId, email, name, role: 'SUPER_ADMIN'|'OPERATOR', isActive, lastLoginAt: string|null, createdAt }`

로그인 실패(없는 이메일·비밀번호 불일치·비활성)는 모두 401 "이메일 또는 비밀번호가 올바르지 않습니다."로 통일한다.

## 어드민 계정 `/admin/admins` (SUPER_ADMIN)

| 메서드 | 경로 | 요청 | 응답 data |
|---|---|---|---|
| GET | /admin/admins | - | `{ admins: AdminProfile[] }` |
| POST | /admin/admins | `{ email, name(1~50), password(8~72), role }` | `AdminProfile` (중복 이메일 409) |
| PATCH | /admin/admins/:adminId | `{ name?, role?, isActive? }` | `AdminProfile` (본인 강등·비활성 400, 마지막 활성 SUPER_ADMIN 강등·비활성 400) |
| PATCH | /admin/admins/:adminId/password | `{ newPassword }` | `{ adminId }` (본인 대상 400, 본인은 `PATCH /admin/auth/me/password`) |

## 감사 로그 `/admin/audit-logs`

GET `?adminId&targetType&targetId&action&page&size` → items: `{ auditLogId, admin: { adminId, name, email }, action, targetType, targetId|null, detail|null, createdAt }` (최신순)

action 목록: `ADMIN_LOGIN, ADMIN_CREATE, ADMIN_UPDATE, ADMIN_PASSWORD_RESET, ADMIN_PASSWORD_CHANGE, USER_STATUS_UPDATE, USER_WITHDRAW, USER_RESTORE, NOTIFICATION_SEND, NOTIFICATION_RESEND, NOTIFICATION_BROADCAST, SANCTION_CREATE, SANCTION_REVOKE, BAND_MASTER_TRANSFER, BAND_INVITE_LINK_EXPIRE, BAND_DELETE, BAND_RESTORE, GENRE_CREATE, GENRE_UPDATE, GENRE_DELETE, SKILL_TYPE_CREATE, SKILL_TYPE_UPDATE, SKILL_TYPE_DELETE, REPORT_RESOLVE, ANNOUNCEMENT_CREATE, ANNOUNCEMENT_UPDATE, ANNOUNCEMENT_DELETE, SERVICE_SETTINGS_UPDATE`

targetType 목록: `ADMIN, USER, NOTIFICATION, SANCTION, BAND, GENRE, SKILL_TYPE, REPORT, ANNOUNCEMENT, SERVICE_SETTINGS`

## 대시보드 `/admin/dashboard`

- GET `/summary` →
  ```
  { users: { total, active, inactive, suspended, deleted, newToday, newLast7Days, newLast30Days },
    activity: { dau, wau, mau },
    bands: { total, activeLast30Days },
    bandSpaces: { total },
    schedules: { total, createdLast30Days },
    reports: { pending },
    generatedAt }
  ```
  - users.total/active/inactive/suspended는 탈퇴하지 않은 유저 기준, deleted는 탈퇴 유저 수.
  - dau/wau/mau: `last_login_at`이 1/7/30일 이내인 탈퇴 안 한 유저 수.
  - bands.total은 삭제 안 된 밴드, activeLast30Days는 최근 30일 내 일정이 생성된 밴드 수.
- GET `/signups?days=30` (1~180) → `{ days: [{ date: 'YYYY-MM-DD', count }] }` KST, 오늘 포함 오래된 순, 0 채움.
- GET `/funnel?from=YYYY-MM-DD&to=YYYY-MM-DD` (KST, 기본 최근 30일, to 포함) →
  `{ from, to, steps: [{ key: 'SIGNED_UP'|'PROFILE_COMPLETED'|'JOINED_BAND'|'CREATED_SCHEDULE', label, count }] }`
  - 대상은 기간 내 가입한 유저 코호트. PROFILE_COMPLETED=세션(user_skills) 1개 이상, JOINED_BAND=밴드 멤버십 1개 이상, CREATED_SCHEDULE=본인 멤버십으로 만든 일정 1개 이상.
- GET `/storage` → `{ totalBytes, objectCount, topUsers: [{ userId, nickname|null, email|null, bytes, objectCount }], otherBytes, scannedAt }`
  - S3 버킷 전체를 ListObjectsV2로 훑는다. `users/{userId}/...` 키는 유저별로 합산(상위 10명), 나머지는 otherBytes.

## 회원 `/admin/users`

| 메서드 | 경로 | 요청 | 응답 data |
|---|---|---|---|
| GET | /admin/users | `?keyword&status&page&size` | `{ items: AdminUserListItem[], pagination }` |
| GET | /admin/users/:userId | - | `AdminUserDetail` |
| PATCH | /admin/users/:userId/status | `{ status: 'ACTIVE'|'INACTIVE', reason? }` | `{ userId, status }` |
| POST | /admin/users/:userId/withdraw | `{ reason? }` | `{ userId, deletedAt }` |
| POST | /admin/users/:userId/restore | - | `{ userId, deletedAt: null, status }` |
| GET | /admin/users/:userId/notifications | `?page&size` | `{ items: AdminNotification[], pagination }` |
| POST | /admin/users/:userId/notifications | `{ title(1~120), description?, targetPath? }` | `{ notificationId }` |
| GET | /admin/users/:userId/sanctions | - | `{ sanctions: Sanction[] }` |
| POST | /admin/users/:userId/sanctions | `{ type, reason(1~500), endsAt? }` | `Sanction` |
| POST | /admin/sanctions/:sanctionId/revoke | - | `Sanction` |
| POST | /admin/notifications/:notificationId/resend | - | `{ notificationId }` (새 알림, NOTICE만) |
| POST | /admin/notifications/broadcast (SUPER) | `{ title, description?, targetPath? }` | `{ sentCount }` (탈퇴·비활성·이용 정지 회원 제외) |

- keyword: 이메일 부분일치 · 닉네임 부분일치 · UUID면 ID 일치(OR).
- status 필터: `ACTIVE`(탈퇴X·ACTIVE·정지X) | `INACTIVE`(탈퇴X·INACTIVE) | `SUSPENDED`(탈퇴X·활성 정지 있음) | `DELETED`(탈퇴). 없으면 전체.
- `AdminUserListItem = { userId, email|null, nickname|null, avatarUrl|null, status: 'ACTIVE'|'INACTIVE', isDeleted, isSuspended, providers: string[], hasPassword, bandCount, createdAt, lastLoginAt|null, deletedAt|null }`
- `AdminUserDetail = AdminUserListItem & { selfDescription|null, oauthAccounts: [{ provider, email|null, createdAt }], bands: [{ bandId, name, role, joinedAt, isDeleted }], activeSuspension: { sanctionId, reason, endsAt|null, createdAt } | null, reportCounts: { received, made } }`
- `AdminNotification = { notificationId, type, title, description|null, targetPath|null, isRead, createdAt }`
- `Sanction = { sanctionId, userId, type: 'WARNING'|'SUSPENSION', reason, endsAt|null, isActive, createdAt, createdBy: { adminId, name }, revokedAt|null, revokedBy: { adminId, name }|null }`
  - isActive: SUSPENSION이고 revokedAt 없음이고 (endsAt 없음 또는 미래). WARNING은 항상 false.
  - 생성 규칙: WARNING에 endsAt 주면 400, SUSPENSION endsAt은 미래여야 함, 이미 활성 정지가 있으면 409(회원 행을 잠근 뒤 확인해 동시 요청도 하나만 성공). WARNING은 유저에게 NOTICE 알림("운영 정책 위반 경고")을 함께 보낸다.
  - 철회: 이미 철회됐거나 WARNING이면 400.
- 탈퇴 처리: 이미 탈퇴면 400, 복구: 탈퇴 아니면 400. 탈퇴는 유저 탈퇴 API(softDeleteUser)와 같이 `deletedAt=now`, `status=INACTIVE`로 바꾸고, 탈퇴 직전 상태를 감사 로그 detail(`previousStatus`)에 남긴다. 복구는 `deletedAt=null`로 되돌리고 상태는 그 탈퇴 건(detail의 `deletedAt`이 현재 값과 같은 USER_WITHDRAW)의 `previousStatus`로, 기록이 없으면(유저가 직접 탈퇴) `ACTIVE`로 한다.
- 관리자 발송 알림은 type `NOTICE`.

## 밴드 `/admin/bands`

| 메서드 | 경로 | 요청 | 응답 data |
|---|---|---|---|
| GET | /admin/bands | `?keyword&includeDeleted&page&size` | `{ items: AdminBandListItem[], pagination }` |
| GET | /admin/bands/:bandId | - | `AdminBandDetail` |
| PATCH | /admin/bands/:bandId/master | `{ userId }` | `{ bandId, bandMasterUserId, previousBandMasterUserId }` |
| POST | /admin/bands/:bandId/invite-link/expire | - | `{ bandId, expiredAt }` |
| DELETE | /admin/bands/:bandId | - | `{ bandId, deletedAt }` |
| POST | /admin/bands/:bandId/restore | - | `{ bandId, deletedAt: null }` |

- keyword: 밴드명 부분일치 또는 UUID면 ID 일치.
- `AdminBandListItem = { bandId, name, visibility, coverImgUrl|null, bandMaster: { userId, nickname|null, email|null }, memberCount, createdAt, deletedAt|null }`
- `AdminBandDetail = { bandId, name, description|null, visibility, coverImgUrl|null, createdAt, updatedAt, deletedAt|null, genres: [{ genreId, name }], bandMaster: {...}, members: [{ bandMemberId, userId, nickname|null, email|null, role, joinedAt }], bandSpaces: [{ bandSpaceId, name, spaceType|null, status, memberCount, createdAt, deletedAt|null }], pendingJoinRequests: [{ requestId, userId, nickname|null, createdAt }], pendingInvitations: [{ invitationId, inviteeUserId, inviteeNickname|null, createdAt }], inviteLink: { hasActiveLink, expiredAt|null }, counts: { songs, schedules, teams, places } }`
- 밴드장 이전: 삭제된 밴드 404, 대상이 멤버가 아니면 400, 이미 밴드장이면 400. 대상 멤버 role=BM, 기존 밴드장 멤버 role=ADMIN(멤버로 남아 있을 때), `bands.bm_id` 변경.
- 초대 링크 만료: 활성 링크가 없으면 400, 있으면 expiredAt=now.
- 삭제/복구: 이미 삭제됨/삭제 안 됨이면 400.

## 마스터 데이터 `/admin/genres`, `/admin/skill-types`

| 메서드 | 경로 | 요청 | 응답 data |
|---|---|---|---|
| GET | /admin/genres | - | `{ genres: [{ genreId, name, sortOrder, usageCount }] }` |
| POST | /admin/genres | `{ name(1~40), sortOrder? }` | 위 항목 1개 (중복 이름 409) |
| PATCH | /admin/genres/:genreId | `{ name?, sortOrder? }` | 위 항목 1개 |
| DELETE | /admin/genres/:genreId | - | `{ genreId }` (사용 중이면 409) |
| GET | /admin/skill-types | - | `{ skillTypes: [{ skillTypeId, name, sortOrder, usageCount }] }` |
| POST/PATCH/DELETE | /admin/skill-types[/:skillTypeId] | 동일 | 동일 (`skillTypeId`) |

- 정렬: sortOrder asc, name asc. usageCount: 장르=band_genres+favor_genres, 세션=user_skills+song_skills+team_members+schedule_participants.
- 사용 중 삭제를 막는 이유: 장르와 user_skills·song_skills FK는 CASCADE라 함께 사라지고, team_members·schedule_participants는 SetNull로 배정이 비워진다.
- 생성 시 sortOrder를 생략하면 현재 최댓값+1(비어 있으면 0)이 된다. 이름 중복 비교는 DB 유니크와 같이 대소문자를 구분한다.

## 신고

- 유저용 `POST /users/:userId/reports` (유저 액세스 토큰) `{ reason: 'SPAM'|'ABUSE'|'INAPPROPRIATE_CONTENT'|'FRAUD'|'OTHER', description?(≤1000) }` → `{ reportId }`
  - 본인 신고 400, 대상 없음/탈퇴 404, 같은 대상에 PENDING 신고가 이미 있으면 409.
- 어드민 `GET /admin/reports?status&page&size` → items: `Report` (최신순)
- `GET /admin/reports/:reportId` → `Report`
- `PATCH /admin/reports/:reportId` `{ status: 'RESOLVED'|'DISMISSED', resolutionNote? }` → `Report` (PENDING이 아니면 400)
- `Report = { reportId, reason, description|null, status, reporter: { userId, nickname|null, email|null }, reported: { userId, nickname|null, email|null, isSuspended }, createdAt, resolvedAt|null, resolutionNote|null, resolvedBy: { adminId, name }|null }`

## 공지 `/admin/announcements`

| 메서드 | 경로 | 요청 | 응답 data |
|---|---|---|---|
| GET | /admin/announcements | `?page&size` | `{ items: Announcement[], pagination }` (최신 생성순) |
| POST | /admin/announcements | `{ title(1~120), content(1~5000), isPublished, startsAt?, endsAt? }` | `Announcement` |
| PATCH | /admin/announcements/:announcementId | 부분 | `Announcement` |
| DELETE | /admin/announcements/:announcementId | - | `{ announcementId }` |

- `Announcement = { announcementId, title, content, isPublished, startsAt|null, endsAt|null, createdAt, updatedAt, createdBy: { adminId, name } }`
- startsAt ≥ endsAt이면 400.
- 공개 `GET /announcements/active` (인증 없음) → `{ announcements: [{ announcementId, title, content, startsAt|null, endsAt|null }] }` : 게시됨 + (startsAt 없음 또는 과거) + (endsAt 없음 또는 미래), 최신순.

## 서비스 설정

- `GET /admin/service-settings` → `{ maintenanceEnabled, maintenanceMessage|null, minAppVersion|null, updatedAt|null, updatedBy: { adminId, name }|null }`
- `PATCH /admin/service-settings` (SUPER) `{ maintenanceEnabled?, maintenanceMessage?(≤500, null 허용), minAppVersion?('x.y.z', null 허용) }` → 위와 동일
- 공개 `GET /service-status` → `{ maintenanceEnabled, maintenanceMessage|null, minAppVersion|null }`
- 점검 중 503 응답: `{ status: 'fail', error: { code: 'SERVICE_UNAVAILABLE', details: { statusCode: 503 } }, message: <점검 문구 또는 기본 문구>, data: {} }`. 설정을 읽지 못하면 막지 않고 통과시킨다(fail-open).
- 행이 없으면 기본값(false/null)으로 응답하고, PATCH 시 id=1로 upsert.
- 점검 미들웨어는 설정을 10초 메모리 캐시한다. PATCH 직후 같은 프로세스 캐시는 즉시 무효화.

## 보안·운영 규칙 (QA 반영)

- **로그인 잠금**: 같은 이메일로 성공 없이 10번 시도하면 15분 동안 429 `로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요.` 시도는 비밀번호 비교 전에 세므로 동시에 보낸 요청도 10번까지만 비교한다. 성공하면 횟수가 초기화되고, 15분 지난 기록은 1분마다 정리한다. 서버 메모리 기준이라 재시작하면 풀린다(현재 단일 인스턴스).
- **응답 시간 균일화**: 계정이 없어도 같은 비용의 bcrypt 비교를 해서 응답 시간으로 이메일 존재 여부가 드러나지 않는다.
- **비밀번호 변경·초기화 시 토큰 무효화**: `admin_users.password_changed_at`보다 먼저 발급된 토큰은 401 `세션이 만료되었습니다. 다시 로그인해 주세요.` 본인 변경(`PATCH /admin/auth/me/password`)은 새 토큰 쌍을 함께 돌려줘 현재 세션이 이어진다.
- **알림 재발송 제한**: `NOTICE` 알림만 재발송한다. 초대 알림을 복제하면 이미 처리된 초대를 가리키는 수락 버튼이 생기기 때문이다. 수신자가 탈퇴했으면 400.
- **밴드장 이전**: 탈퇴한 회원에게는 넘길 수 없다(400).
- **스토리지 권한 부족**: `s3:ListBucket` 권한이 없으면 503 `스토리지 목록 조회 권한(s3:ListBucket)이 없어 사용량을 집계할 수 없습니다.`
- **SUPER_ADMIN 최소 인원**: 활성 SUPER_ADMIN 행을 잠근 뒤 확인해, 서로를 동시에 강등·비활성화해도 한 명은 남는다.
- **전체 알림 발송**: 1,000건씩 나눠 넣고 트랜잭션 제한 시간을 60초로 둔다.
- **알려진 한계(수용)**: 유저 신고의 중복 검사는 DB 제약 없이 조회 후 저장이라 동시 요청이 겹치면 중복이 생길 수 있다. 전체 알림 발송은 회원 수가 매우 커지면 비동기 배치로 바꿔야 한다.

## 감사 로그 기록 규칙

모든 쓰기 API는 같은 트랜잭션에서 `admin_audit_logs`에 한 행을 남긴다. 로그인은 `ADMIN_LOGIN`으로 남는다.

| action | targetType / targetId | detail |
|---|---|---|
| USER_STATUS_UPDATE | USER / userId | `{ from, to, reason }` |
| USER_WITHDRAW | USER / userId | `{ reason, previousStatus, deletedAt }` |
| USER_RESTORE | USER / userId | `{ status }` (복구 후 상태) |
| NOTIFICATION_SEND | USER / userId | `{ notificationId, title }` |
| NOTIFICATION_RESEND | NOTIFICATION / 원본 notificationId | `{ newNotificationId }` |
| NOTIFICATION_BROADCAST | NOTIFICATION / null | `{ title, sentCount }` |
| SANCTION_CREATE | USER / userId | `{ sanctionId, type, endsAt }` |
| SANCTION_REVOKE | SANCTION / sanctionId | `{ userId }` |
| BAND_MASTER_TRANSFER | BAND / bandId | `{ from, to }` |
| GENRE_*, SKILL_TYPE_* | GENRE·SKILL_TYPE / id | `{ name, sortOrder }` |
| REPORT_RESOLVE | REPORT / reportId | `{ status }` |
| ANNOUNCEMENT_CREATE / UPDATE / DELETE | ANNOUNCEMENT / id | `{ title, isPublished }` / `{ changedFields }` / `{ title }` |
| SERVICE_SETTINGS_UPDATE | SERVICE_SETTINGS / null | 실제로 바뀐 필드와 새 값 |
| ADMIN_* | ADMIN / adminId | 생성 `{ email, role }`, 수정 `{ name, role, isActive }` |
