# 합주 일정 조율 투표 MVP 설계

## 범위

- 합주 공간이 속한 밴드의 멤버가 후보 시간 목록으로 일정 조율 투표를 생성한다. 권한 기준은 bandspaces·schedules 모듈과 같다.
- 밴드 멤버가 합주 공간의 투표 목록을 조회한다.
- 밴드 멤버가 투표 상세와 후보별 투표자 목록을 조회한다.
- 밴드 멤버가 자신의 후보 선택을 전량 교체하거나 빈 배열로 철회한다.
- 투표 생성자 또는 밴드 리더·부리더가 투표를 삭제한다.
- 상세 조회 시 최다 득표 후보를 추천한다. 0표는 추천하지 않고 동률은 모두 추천한다.
- 기존 일정 분석, 실제 일정 생성, 투표 수정, 마감, 알림은 제외한다.

## 모듈 경로와 파일 목록

- `src/modules/schedule-polls/`
  - `dto/create-schedule-poll.dto.ts`
  - `dto/update-schedule-poll-vote.dto.ts`
  - `repositories/schedule-polls.repository.ts`
  - `repositories/schedule-polls.prisma-repository.ts`
  - `schedule-polls.controller.ts`
  - `schedule-polls.module.ts`
  - `schedule-polls.service.ts`
  - `schedule-polls.service.spec.ts`
  - `repositories/schedule-polls.prisma-repository.spec.ts`
  - `types/schedule-poll.type.ts`
- `prisma/schema.prisma`
- `prisma/migrations/*_add_schedule_polls/migration.sql`
- `src/app.module.ts`
- `docs/backend/api-docs/schedule-polls.md`

## Repository 인터페이스

- `findActiveBandSpaceById`: 삭제되지 않은 합주 공간 확인
- `findBandMemberByBandSpaceIdAndUserId`: 합주 공간이 속한 밴드의 멤버 ID와 역할 확인
- `lockBandMemberForVote`: 같은 멤버의 투표 교체를 직렬화하기 위한 `FOR UPDATE` 잠금
- `createSchedulePoll`: 투표와 후보 시간을 함께 생성
- `findSchedulePollContextById`: 투표의 합주 공간 ID와 생성자 확인
- `findSchedulePollsByBandSpaceId`: 합주 공간의 투표 목록과 후보 수, 투표자 수, 내 참여 여부 조회
- `findSchedulePollById`: 후보, 투표자 프로필, 내 선택을 포함한 상세 조회
- `countSchedulePollOptionsByIds`: 전달된 후보가 모두 해당 투표 소속인지 확인
- `replaceSchedulePollVotes`: 사용자의 기존 선택을 삭제한 뒤 새 선택 생성
- `deleteSchedulePoll`: 투표 삭제(후보·선택은 cascade)

## Service 비즈니스 규칙

- 생성
  - 합주 공간이 없으면 `NotFoundException`
  - 합주 공간이 속한 밴드의 멤버가 아니면 `ForbiddenException`
  - 후보 시간의 종료가 시작보다 늦지 않으면 `BadRequestException`
  - 중복 후보 시간이 있으면 `BadRequestException`
- 목록 조회
  - 합주 공간이 없으면 `NotFoundException`
  - 합주 공간이 속한 밴드의 멤버가 아니면 `ForbiddenException`
  - 최신 생성순, 페이지네이션 없음
- 조회
  - 투표가 없으면 `NotFoundException`
  - 합주 공간이 속한 밴드의 멤버가 아니면 `ForbiddenException`
  - 가장 많은 표를 받은 후보를 추천하며 0표는 추천하지 않고 동률은 모두 추천
- 투표
  - 투표가 없으면 `NotFoundException`
  - 합주 공간이 속한 밴드의 멤버가 아니면 `ForbiddenException`
  - 중복 후보 ID 또는 다른 투표의 후보 ID가 있으면 `BadRequestException`
  - 기존 선택을 요청 배열로 전량 교체하며 빈 배열은 철회
  - 삭제 후 삽입 사이에 같은 멤버의 요청이 겹치면 unique 제약 위반(500)이 나므로, 교체 전에 밴드 멤버 행을 잠가 직렬화
- 삭제
  - 투표가 없으면 `NotFoundException`
  - 합주 공간이 속한 밴드의 멤버가 아니면 `ForbiddenException`
  - 생성자도 밴드 리더(BM)·부리더(ADMIN)도 아니면 `ForbiddenException`
- 모든 Service 메서드는 마지막 인자로 외부 transaction client를 받을 수 있다.

## 관련 DB 모델

- `SchedulePoll`: `BandSpace`, 생성자 `BandMember`와 연결. 생성자는 nullable
- 밴드 탈퇴는 `BandMember` 행을 삭제하므로, 생성자 FK는 `SetNull`로 두어 투표와 다른 멤버의 선택을 보존
- `SchedulePollOption`: 투표별 후보 시작/종료 시간
- `SchedulePollVote`: 후보와 투표한 `BandMember` 연결
- 합주 공간 → 투표 → 후보 → 선택, 투표자 `BandMember` → 선택은 cascade hard delete
- `SchedulePollOption(schedulePollId, startAt, endAt)`, `SchedulePollVote(schedulePollOptionId, bandMemberId)` unique

## 테스트 계획

- 생성 성공, 공간 없음, 멤버 아님, 잘못된 시간, 중복 후보
- 목록 성공, 공간 없음, 멤버 아님, 외부 transaction 전달
- 상세 성공, 투표 없음, 멤버 아님, 추천 없음/단독/동률
- 투표 성공/철회, 투표 없음, 멤버 아님, 중복 후보, 다른 투표 후보, 교체 전 잠금
- 삭제 생성자/리더/부리더 성공, 권한 없음, 투표 없음, 멤버 아님
- mutation의 transaction 일관성과 외부 transaction 전달
- Repository의 멤버 조회, 잠금, 생성, 상세 매핑, 목록 집계, 투표 전량 교체, 삭제 쿼리

## API 명세 위치

- `docs/backend/api-docs/schedule-polls.md`
- `POST /bandspaces/{bandSpaceId}/schedule-polls`
- `GET /bandspaces/{bandSpaceId}/schedule-polls`
- `GET /schedule-polls/{schedulePollId}`
- `PUT /schedule-polls/{schedulePollId}/votes/me`
- `DELETE /schedule-polls/{schedulePollId}`
