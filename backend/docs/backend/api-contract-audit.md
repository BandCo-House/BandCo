# FE–BE API 계약 감사 (2026-09-06, dev `e67fe08` 기준)

프론트 `src/**/api/*.ts`의 호출 지점 60여 곳과 백엔드 컨트롤러 전체 라우트를 대조했다. 운영 로그인이 오늘 처음 실서버에 붙으면서 프로필 페이지 계약 불일치(#183)가 드러난 것을 계기로, 같은 종류의 문제를 전수 조사한 결과다.

## 1. 전송 계층(envelope)

| 항목 | 백엔드 | 프론트 | 판정 |
|------|--------|--------|------|
| 성공 응답 | `createSuccessResponse` → `{ status:'success', error:null, message, data }`. 모든 컨트롤러가 사용 | `apiGet/apiPost/...`가 `data.data`만 꺼냄(대부분). 일부는 `apiClient` 직접 호출 후 envelope 전체를 zod로 파싱 | 동작하지만 방식이 3가지 |
| 실패 응답 | 글로벌 ExceptionFilter 없음 → Nest 기본 `{ statusCode, message, error }`. `ApiFailResponse`(`status:'fail'`) 타입은 정의만 있고 미사용 | `getApiErrorMessage`는 `message`만 읽음(동작). zod discriminated union은 `status:'error'` 분기를 두는데 백엔드는 절대 보내지 않음(죽은 분기) | 양쪽 다 자기 타입과 실제가 다름 |
| 프론트 타입 | — | `shared/api/types.ts`의 `ApiResponse<T>`가 `success: boolean`으로 선언 | 실제와 불일치(런타임엔 미사용) |
| MSW 목 | — | 17개 핸들러 파일 중 `success:true` 34곳, `status:'success'` 19곳 혼재. `apiGet`이 `.data`만 읽어 둘 다 "동작"함 | **불일치가 dev에서 안 잡히는 근본 원인** |

## 2. 엔드포인트별 불일치

### 2-1. 운영에서 깨지는 것 (즉시 수정)

| # | FE 호출 | BE 실제 | 증상 | 사용처 |
|---|---------|---------|------|--------|
| B1 | `POST /bands/:bandId/invitations` body `{ inviteeEmail }` | `CreateBandInvitationBodyDto { inviteeUserId (uuid), message? }` | 400 | `BandInviteModal` |
| B2 | `DELETE /bands/:bandId/users/:userId` (강퇴) | 라우트 없음 (`DELETE :bandId/me`, `DELETE :bandId`만 존재) | 404 | `BandMemberSettings` |
| B3 | `GET /users/profile-music/search?query=` → 배열 기대 | `SearchProfileMusicQueryDto.q`, 응답 `{ items }` | 400 또는 zod 실패 | `ProfileMusicSearchDialog` |
| B4 | `GET /users/:id/profiles` `profile.profileMusic` | (#183에서 백엔드를 프론트에 맞춤) | 해결됨 | 프로필 |

### 2-2. 지금은 동작하지만 타입·구조가 거짓인 것

| # | 내용 |
|---|------|
| L1 | `PATCH /bands/:bandId/users/:userId` — BE `{ member: { userId, role } }`, FE 타입은 평평한 `{ bandId, userId, role }`. FE가 반환값을 안 써서 티가 안 남 |
| L2 | `POST /bands/:bandId/invitations` 반환 타입 `Invite`(legacy: id/bandName/inviteeEmail/inviteCode/token) — BE `CreateBandInvitationResult`와 무관. `entities/invite/model/schema.ts`의 `inviteSchema`는 백엔드 어디에도 대응하지 않는 유령 타입 |
| L3 | `entities/team/api/team-api.ts` 전체 — `apiGet<{ data: ... }>` 후 `data.data ?? data`로 이중 언랩을 방어적으로 처리. 작성자가 언랩 여부를 확신 못 한 흔적. 계약 확정 후 제거 대상 |
| L4 | `GET /invites/:bandId`(`features/invite-list`) — BE 라우트 없음, FE에서도 호출처 없음. 죽은 코드 |
| L5 | `GET /bands/:bandId/notices` — BE 미구현(FE TODO 명시), 호출처 없음 |
| L6 | `POST /auth/email` — FE가 `message`에 '중복' 문자열이 있는지로 판별. 문구 바뀌면 깨짐. BE `data`에 `duplicated: boolean` 추가가 맞음 |
| L7 | `GetSchedulesResponse.items[].startAt: string`(FE) vs BE `string | null` — 미세 |
| L8 | **enum 드리프트**: BE `BandInvitationStatus`에 `EXPIRED`가 있으나 FE `inviteStatusSchema`·알림 `reference.status` enum에는 없음. 초대가 만료된 뒤 그 알림이 목록에 섞이면 `GET /notifications/me` 전체가 zod 실패로 빈 화면이 된다. 나머지 enum(SongKey 24개, 역할, 상태 등)은 일치 |
| null` — 미세 |

### 2-3. 동작하지만 BE 스스로 일관성이 없어 FE가 매번 특수 처리하는 것

| 축 | 현재 상태 | 예 |
|----|-----------|-----|
| 단건 응답 래핑 | 어떤 건 `{ band }`, `{ schedule }`, `{ song, skillTypes }`, `{ space, members, songCount, scheduleCount }`로 감싸고, 어떤 건 평평함 | `GET /bands/:id`→`{band}` vs `PATCH /bands/:id`→평평, `GET /teams/:id`→평평 |
| 목록 키 | `items`(대부분) / `members`(`GET /bands/:id/users`) / `genres`·`skills`(common) / **bare array**(`GET /songs/tracks/search`) / `{items}`(profile-music search) | 같은 "검색" API인데 songs는 배열, profile-music은 `{items}` |
| 페이지네이션 meta | 커서형 `meta { count, take, cursor, next }`(대부분) vs 오프셋형 `pagination { page, size, totalCount, hasNext }`(bandspaces). `next`가 URL 문자열인 곳과 커서 객체인 곳 혼재(songs·join-requests) | FE `bandListMetaSchema`가 optional 투성이인 이유 |
| 식별자 이름 | `id`(bands list/detail/create, songs, users) vs `bandId`/`spaceId`/`teamId`/`placeId`(대부분) | FE `searchBandItemSchema`가 `id?`와 `bandId?`를 둘 다 받음 |
| 변경 응답 | 역할 변경만 `{ member }`로 감쌈, 나머지는 평평. 수정 응답이 전체 리소스인 곳(band, place)과 부분(schedule: `songIds`만)인 곳 혼재 | |
| 정렬 파라미터 | places만 `'ASC'/'DESC'`, 나머지 `'asc'/'desc'` (IMPROVEMENTS 기록됨) | |
| 아바타 필드명 | `avatarUrl`(users, band members) vs `profileImageUrl`(team members, 일정 참가자) | |

## 3. 어느 쪽에 맞출 것인가

원칙 세 가지로 나눠 판단하는 것을 제안한다.

1. **필드·경로·파라미터 불일치(2-1, 2-2)** → **FE를 BE에 맞춘다.** api-docs·Notion 명세·Prisma 타입이 백엔드에 있고, 양쪽 하네스 문서(fe-api 스킬)도 백엔드 코드를 1차 소스로 정의한다. 예외는 오늘 프로필처럼 백엔드 구현이 자기 설계 문서와 어긋난 경우이며 그때만 BE를 고친다.
2. **UI가 이미 출시됐는데 BE 라우트가 없는 것(B2 강퇴)** → **BE에 추가한다.** 제품 의도가 UI로 확정돼 있다.
3. **BE 내부 일관성(2-3)** → **BE에서 규칙을 정해 정규화한다.** FE 어댑터를 N개 두는 것보다 엔드포인트당 한 번 고치는 게 싸다. 다만 FE 호출처를 같은 PR 묶음에서 함께 바꿔야 하므로 FE 팀원과 일정을 맞춰 단계적으로 진행한다.

## 4. 제안 규칙 (conventions.md에 추가할 초안)

- 성공: `{ status:'success', error:null, message, data }` (현행 유지)
- 실패: 글로벌 ExceptionFilter로 `{ status:'fail', error:{ code, message }, message, data:{} }`. `message`는 사용자 노출 문구, `error.code`는 `USER_NOT_FOUND`처럼 기계용
- 목록: `data = { items, meta }`. `meta = { count, take, cursor, next }`, `next`는 항상 URL 문자열 또는 null. 오프셋 페이지네이션은 신규 도입 금지(bandspaces는 마이그레이션 대상)
- 단건: `data`는 리소스 자체(평평). `{ band: {...} }`식 래핑 금지. 부가 정보가 필요하면 리소스 옆 형제 키로(`{ ...space, members, songCount }`)
- 식별자: 리소스 자기 id는 `<entity>Id`(`bandId`, `spaceId`). `id`는 쓰지 않는다
- 사람 아바타는 `avatarUrl`로 통일
- 정렬·커서 파라미터는 소문자 `asc`/`desc`

## 5. 실행 계획

| 단계 | 내용 | 측 | 규모 |
|------|------|----|------|
| P1 깨진 것 수정 | B1 초대(이메일→userId 조회 후 전송 또는 BE가 email 수용), B2 강퇴 라우트 추가, B3 profile-music 파라미터·응답, L6 `duplicated`, L8 `EXPIRED` enum 반영 | FE 4 + BE 2 | 각 1~2시간 |
| P2 FE 전송 계층 통일 | `ApiResponse` 타입 수정, `apiClient` 직접 호출 5곳을 `apiGet` 계열로, `status:'error'` 유니온 제거, team-api 이중 언랩 제거, L2/L4/L5 죽은 코드 삭제, MSW `ok()` 헬퍼로 envelope 통일 | FE | 반나절 |
| P3 BE 실패 응답 통일 | 글로벌 ExceptionFilter + `ApiFailResponse` 사용, api-docs 에러 예시 갱신 | BE | 반나절 |
| P4 BE 응답 형태 정규화 | 2-3 항목을 규칙(§4)대로 엔드포인트별 이관. FE 호출처 동시 수정. 우선순위: 단건 래핑 제거 → 목록 키 `items` → meta.next 통일 → id 네이밍 → bandspaces 커서화 | BE+FE | 며칠, 분할 PR |

P1·P2·P3는 서로 독립이라 바로 시작할 수 있다. P4는 FE 팀원과 합의 후 착수한다.

## 6. 진행 상황 (2026-09-06)

| 단계 | 상태 | PR |
|------|------|----|
| P1 | 완료 | BE #188, FE #189 |
| P3 | 완료 | BE #190 (`ApiExceptionFilter`) |
| P2 | 완료 | FE (이 문서와 같은 PR) — `ApiSuccessResponse`/`ApiFailResponse` 타입, `apiClient` 직접 호출 제거, envelope zod 유니온 제거, team-api 이중 언랩 제거, `features/invite-list`·`inviteSchema` 삭제, MSW 34곳 envelope 통일 + Nest 기본 에러 4곳을 fail envelope로 교체 |
| P4 | 미착수 | FE 팀원 합의 후 |

### P2 중 추가로 발견한 운영 결함

| ID | 내용 | 조치 |
|----|------|------|
| B5 | **토큰 재발급 응답 언랩 누락**: BE `POST /auth/token/access`·`/auth/token/refresh`는 `createSuccessResponse`로 감싸 `{ data: { accessToken } }`를 주는데, FE `refreshAccessToken`/`refreshRefreshToken`은 본문에서 `accessToken`을 바로 읽어 `undefined`를 저장했다. 액세스 토큰 만료 후 첫 401에서 `Bearer undefined`로 재시도해 다시 401 → 재발급 → 실패가 반복된다. MSW 목이 원시 `{ accessToken }`을 돌려줘 dev에서는 드러나지 않았다 | FE `client.ts`에서 `data.data.accessToken` 읽도록 수정, 목·테스트를 envelope로 교체 |
| B6 | **만료·변조 토큰에 500 응답**: `AuthService.verifyToken`이 `jwtService.verify`의 `TokenExpiredError`·`JsonWebTokenError`를 감싸지 않아 가드에서 500으로 떨어졌다. 프론트 인터셉터는 401에서만 재발급하므로 액세스 토큰(5분) 만료 뒤 모든 요청이 "서버 오류"가 됐다(B5와 겹쳐 재발급 자체가 시작되지 못했다). 운영 브라우저 스모크 테스트(밴드 생성)에서 발견 | BE `verifyToken`에서 401 `만료된 토큰입니다.`/`유효하지 않은 토큰입니다.`로 변환, spec 2건 추가 |

MSW 헬퍼(`ok()`/`fail()`)는 만들지 않았다. 핸들러마다 봉투 리터럴을 그대로 쓰는 편이 grep이 쉽고 백엔드 형태와 1:1로 대응돼 규칙(`frontend/AGENTS.md` MSW 표)으로만 고정했다.

### 운영 브라우저 스모크 테스트 (2026-09-06, band-co.vercel.app, Google 로그인 계정)

| 흐름 | 결과 |
|------|------|
| 프로필 조회·수정, 프로필 음악 검색(`q`)·저장(`profile.profileMusic`) | 통과 |
| 액세스 토큰(5분) 만료 → 401 → 재발급 → 재시도 | B6 배포 후 통과. 로그인 페이지로 튕기지 않음 |
| 밴드 생성, 밴드 설정 저장(PATCH), 초대 링크 발급·폐기 | 통과 |
| 팀 생성(`CreateTeamResult` 평면) → 팀 상세·팀원 목록(`{ teamId, items, meta }`) → 팀 삭제 | 통과 |
| 라이브러리 합주곡 검색·추가, 연습 장소 추가 | 통과 |
| 알림 목록·읽지 않은 알림 요약 | 통과(빈 목록) |
| 합주 공간 생성 | **실패(500)** → B7 |
| 일정 생성 | 미검증(합주 공간 선행 필요) |
| 다른 유저 초대 | 미검증(실사용자에게 알림이 가므로 제외) |

| ID | 내용 | 조치 |
|----|------|------|
| B7 | **합주 공간 모듈이 데모 밴드 멤버 ID를 하드코딩**: `bandspaces.prisma-repository.ts`의 `DEMO_BAND_MEMBER_ID`(`11111111-…`)를 생성자·LEADER 멤버·목록 `isMine`/`onlyMine`/`myMembership`에 사용한다. 운영 DB에 그 멤버가 없어 `POST /bands/:id/bandspaces`가 FK 오류로 500. 컨트롤러에 가드도 없다(api-docs #28~#32는 401/403을 정의) | 조치 완료(2026-09-06): 전 라우트 `AccessTokenGuard`, 요청자의 밴드 멤버를 `bandId+userId`로 조회(밴드·공간 없음 404, 멤버 아님 403), 생성자·LEADER·`isMine`·`onlyMine`·`myMembership`에 사용. `be-orchestrate` 설계 문서: `docs/backend/designs/bandspaces/requester-band-member.md` |
| D1 | **장르·스킬 마스터 데이터 없음**: 운영 `GET /common/genres`·`/common/skills`가 빈 배열. `prisma/seed.ts`에도 마스터 데이터가 없어 프로필의 선호 장르·플레이 파트를 아무도 설정할 수 없다 | 마스터 데이터 시드(장르·스킬 목록) 정의 필요. 공용 DB라 dev도 동일 |
| D2 | **밴드 공지 API 없음**: 프론트 밴드 홈 공지 위젯이 `GET /bands/:id/notices`를 호출하나 백엔드에 모듈이 없다(404). 화면은 "공지를 불러오지 못했어요"로 처리 | 기능 미구현. 백엔드 notices 모듈 또는 프론트 위젯 숨김 중 택일 |

테스트 데이터: 밴드 "스모크테스트 밴드 (삭제 예정)"(`c5886b71-9f0d-42ad-8d21-74d8fdac2b98`, 합주곡 1·연습 장소 1)은 B7 재검증용으로 남겨 두었다. `DELETE /bands/:bandId`(soft delete)로 정리한다.
