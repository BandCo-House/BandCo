# Teams 모듈 설계 문서

**작성일:** 2026-06-28
**API 명세 위치:** `docs/backend/api-docs/teams.md` (#53, #54, #55, #60, #61, #62, #63, #64, #65, #66)

---

## API 명세 보완 내역

> ⚠️ 변환 노트: [설계자 보완 2026-06-28] #53 응답 필드 보완 — `teamLeaderUserId` 단일 필드 대신 teams.md에 없던 `teamLeaderBandMemberId`를 schema 기반으로 추가하고, 생성 응답에서는 리더 object 대신 단순 ID 반환으로 확정.

**상세:**
- #53 생성 응답에서 명세의 `teamLeaderUserId` 필드는 BandMember → User 조인 없이도 반환 가능한 `teamLeaderBandMemberId`로 보완. 생성 직후 User 정보까지 반환하면 추가 조인 쿼리가 필요하므로, 생성 응답은 ID만 반환하는 것이 단순하다.
- 단, 명세가 `teamLeaderUserId`를 명시하고 있으므로 BandMember를 join해 userId도 함께 반환하는 방향으로 설계한다 (명세 준수).

---

## 관련 DB 모델

### Team

```
id                     String          PK
bandId                 String          FK → Band.id
name                   String          VARCHAR(150)
description            String?
status                 TeamStatus      ACTIVE | INACTIVE (default: ACTIVE)
teamLeaderBandMemberId String?         FK → BandMember.id
createdAt              DateTime
updatedAt              DateTime
teamCoverUrl           String?         VARCHAR(255)
```

### TeamMember

```
id           String          PK
teamId       String          FK → Team.id
bandMemberId String          FK → BandMember.id
joinedAt     DateTime        (default: now())
teamRole     TeamMemberRole  LEADER | MEMBER (default: MEMBER)
@@unique([teamId, bandMemberId])
```

### BandMember (참조)

```
id       String          PK
bandId   String          FK → Band.id
userId   String          FK → User.id
role     BandMemberRole  BM | ADMIN | MEMBER
joinedAt DateTime
@@unique([bandId, userId])
```

### UserProfile (참조 — nickname, avatarUrl 조회용)

```
userId    String   PK
nickname  String
avatarUrl String?
```

---

## 작업 범위

```
신규: src/modules/teams/teams.module.ts
신규: src/modules/teams/teams.controller.ts
신규: src/modules/teams/teams.service.ts
신규: src/modules/teams/teams.service.spec.ts
신규: src/modules/teams/repositories/teams.repository.ts
신규: src/modules/teams/repositories/teams.prisma-repository.ts
신규: src/modules/teams/dto/create-team.dto.ts
신규: src/modules/teams/dto/update-team.dto.ts
신규: src/modules/teams/dto/get-band-teams-query.dto.ts
신규: src/modules/teams/dto/get-my-teams-query.dto.ts
신규: src/modules/teams/dto/get-team-members-query.dto.ts
신규: src/modules/teams/dto/change-team-leader.dto.ts
신규: src/modules/teams/dto/add-team-member.dto.ts
신규: src/modules/teams/types/create-team-result.type.ts
신규: src/modules/teams/types/get-band-teams-result.type.ts
신규: src/modules/teams/types/get-my-teams-result.type.ts
신규: src/modules/teams/types/get-team-result.type.ts
신규: src/modules/teams/types/update-team-result.type.ts
신규: src/modules/teams/types/get-team-members-result.type.ts
신규: src/modules/teams/types/change-team-leader-result.type.ts
신규: src/modules/teams/types/remove-team-member-result.type.ts
신규: src/modules/teams/types/add-team-member-result.type.ts
신규: src/modules/teams/types/delete-team-result.type.ts

수정: src/modules/index.ts (TeamsModule export 추가)
수정: src/app.module.ts (TeamsModule import 추가)
```

---

## DTO 정의

### CreateTeamBodyDto (`create-team.dto.ts`)

```typescript
export class CreateTeamBodyDto {
  @ApiProperty({ description: '팀 이름', example: '보컬팀' })
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notEmptyValidationMessage })
  @MaxLength(150, { message: maxLengthValidationMessage })
  name: string;

  @ApiPropertyOptional({ description: '팀 설명', example: '여자 보컬 중심 팀' })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  description?: string;

  @ApiPropertyOptional({ description: '팀 커버 이미지 URL', example: 'https://example.com/cover.png' })
  @IsOptional()
  @IsUrl({}, { message: urlValidationMessage })
  teamCoverUrl?: string;
}

export type CreateTeamInput = CreateTeamBodyDto;
```

### UpdateTeamBodyDto (`update-team.dto.ts`)

```typescript
export class UpdateTeamBodyDto {
  @ApiPropertyOptional({ description: '팀 이름', example: '메인 보컬팀' })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notEmptyValidationMessage })
  @MaxLength(150, { message: maxLengthValidationMessage })
  name?: string;

  @ApiPropertyOptional({ description: '팀 설명', example: '메인 보컬 중심 팀' })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  description?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'], description: '팀 상태' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'], { message: enumValidationMessage })
  status?: 'ACTIVE' | 'INACTIVE';

  @ApiPropertyOptional({ description: '팀 커버 이미지 URL', example: 'https://example.com/new-cover.png' })
  @IsOptional()
  @IsUrl({}, { message: urlValidationMessage })
  teamCoverUrl?: string;
}

export type UpdateTeamInput = UpdateTeamBodyDto;
```

### GetBandTeamsQueryDto (`get-band-teams-query.dto.ts`)

```typescript
// cursor 기준: createdAt + id
export class GetBandTeamsQueryDto {
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: enumValidationMessage })
  order__created_at: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: enumValidationMessage })
  order__id: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ default: 20, minimum: 1 })
  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  take: number = 20;

  @ApiPropertyOptional()
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  cursor__created_at?: string;

  @ApiPropertyOptional()
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  cursor__id?: string;
}

export type GetBandTeamsQuery = GetBandTeamsQueryDto;
```

### GetMyTeamsQueryDto (`get-my-teams-query.dto.ts`)

```typescript
// cursor 기준: joinedAt + id (TeamMember.joinedAt 기준)
export class GetMyTeamsQueryDto {
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  order__joined_at: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  order__id: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ default: 20, minimum: 1 })
  take: number = 20;

  @ApiPropertyOptional()
  cursor__joined_at?: string;

  @ApiPropertyOptional()
  cursor__id?: string;
}

export type GetMyTeamsQuery = GetMyTeamsQueryDto;
```

### GetTeamMembersQueryDto (`get-team-members-query.dto.ts`)

```typescript
// GetMyTeamsQueryDto와 동일한 cursor 전략 (joinedAt + id)
export class GetTeamMembersQueryDto {
  // GetMyTeamsQueryDto와 동일한 필드 구성
}

export type GetTeamMembersQuery = GetTeamMembersQueryDto;
```

### ChangeTeamLeaderBodyDto (`change-team-leader.dto.ts`)

```typescript
export class ChangeTeamLeaderBodyDto {
  @ApiProperty({ description: '새 팀 리더로 지정할 팀 멤버 ID', example: 'uuid' })
  @IsUUID(undefined, { message: uuidValidationMessage })
  teamMemberId: string;
}
```

### AddTeamMemberBodyDto (`add-team-member.dto.ts`)

```typescript
export class AddTeamMemberBodyDto {
  @ApiProperty({ description: '팀에 추가할 밴드 멤버 ID', example: 'uuid' })
  @IsUUID(undefined, { message: uuidValidationMessage })
  bandMemberId: string;
}
```

---

## 타입 정의

### create-team-result.type.ts

```typescript
export interface CreateTeamResult {
  teamId: string;
  bandId: string;
  name: string;
  description: string | null;
  status: string;
  teamLeaderUserId: string;       // BandMember.userId
  teamCoverUrl: string | null;
  createdAt: string;
}
```

### get-band-teams-result.type.ts

```typescript
export interface TeamLeaderInfo {
  userId: string;
  nickname: string;
}

export interface BandTeamListItem {
  teamId: string;
  name: string;
  description: string | null;
  status: string;
  teamCoverUrl: string | null;
  memberCount: number;
  teamLeader: TeamLeaderInfo | null;
  createdAt: string;
}

export interface BandTeamListCursor {
  createdAt: string;
  id: string;
}

export interface GetBandTeamsResult {
  bandId: string;
  items: BandTeamListItem[];
  meta: {
    count: number;
    take: number;
    cursor: BandTeamListCursor | null;
    next: string | null;
  };
}
```

### get-my-teams-result.type.ts

```typescript
export interface MyTeamListItem {
  teamId: string;
  bandId: string;
  bandName: string;
  name: string;
  description: string | null;
  status: string;
  teamCoverUrl: string | null;
  myTeamRole: string;             // TeamMemberRole (LEADER | MEMBER)
  memberCount: number;
  teamLeader: TeamLeaderInfo | null;
  joinedAt: string;
  createdAt: string;
}

export interface MyTeamListCursor {
  joinedAt: string;
  id: string;                     // TeamMember.id
}

export interface GetMyTeamsResult {
  items: MyTeamListItem[];
  meta: {
    count: number;
    take: number;
    cursor: MyTeamListCursor | null;
    next: string | null;
  };
}
```

### get-team-result.type.ts

```typescript
export interface GetTeamResult {
  teamId: string;
  bandId: string;
  name: string;
  description: string | null;
  status: string;
  teamCoverUrl: string | null;
  teamLeader: TeamLeaderInfo | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### update-team-result.type.ts

```typescript
export interface UpdateTeamResult {
  teamId: string;
  bandId: string;
  name: string;
  description: string | null;
  status: string;
  teamCoverUrl: string | null;
  teamLeader: TeamLeaderInfo | null;
  memberCount: number;
  updatedAt: string;
}
```

### get-team-members-result.type.ts

```typescript
export interface TeamMemberUserInfo {
  userId: string;
  nickname: string;
  profileImageUrl: string | null;
}

export interface TeamMemberListItem {
  teamMemberId: string;
  bandMemberId: string;
  user: TeamMemberUserInfo;
  teamRole: string;
  joinedAt: string;
}

export interface TeamMemberListCursor {
  joinedAt: string;
  id: string;
}

export interface GetTeamMembersResult {
  teamId: string;
  items: TeamMemberListItem[];
  meta: {
    count: number;
    take: number;
    cursor: TeamMemberListCursor | null;
    next: string | null;
  };
}
```

### change-team-leader-result.type.ts

```typescript
export interface ChangeTeamLeaderResult {
  teamId: string;
  teamLeader: TeamLeaderInfo;
}
```

### remove-team-member-result.type.ts

```typescript
export interface RemoveTeamMemberResult {
  teamMemberId: string;
  removed: boolean;
}
```

### add-team-member-result.type.ts

```typescript
export interface AddTeamMemberResult {
  teamMemberId: string;
  teamId: string;
  bandMemberId: string;
  user: TeamMemberUserInfo;
  teamRole: string;
  joinedAt: string;
}
```

### delete-team-result.type.ts

```typescript
export interface DeleteTeamResult {
  teamId: string;
  deleted: boolean;
}
```

---

## Repository 인터페이스

**심볼:** `TEAMS_REPOSITORY`
**파일:** `src/modules/teams/repositories/teams.repository.ts`

```typescript
export const TEAMS_REPOSITORY = Symbol('TEAMS_REPOSITORY');

export interface TeamsRepository {
  /**
   * 밴드가 삭제되지 않은 활성 밴드인지 확인하고 기본 정보를 반환한다.
   * Band.deletedAt이 null인 경우만 반환.
   */
  findActiveBandById(
    bandId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string } | null>;

  /**
   * 특정 사용자가 해당 밴드의 멤버인지 확인한다.
   * BandMember를 bandId + userId 조합으로 조회한다.
   */
  findBandMemberByBandIdAndUserId(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string } | null>;

  /**
   * 팀을 생성하고 생성자를 LEADER 역할의 TeamMember로 동시에 등록한다.
   * Team + TeamMember를 하나의 트랜잭션 내에서 생성.
   * Team.teamLeaderBandMemberId = 생성자의 BandMember.id로 설정.
   */
  createTeam(
    input: CreateTeamRepositoryInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CreateTeamResult>;

  /**
   * 밴드에 속한 팀 목록을 cursor 기반으로 조회한다.
   * memberCount와 teamLeader(nickname 포함)를 함께 반환.
   */
  findTeamsByBandId(
    bandId: string,
    query: GetBandTeamsQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetBandTeamsResult>;

  /**
   * 인증 사용자가 TeamMember로 등록된 팀 목록을 cursor 기반으로 조회한다.
   * TeamMember.joinedAt 기준으로 정렬.
   * bandName, myTeamRole, memberCount, teamLeader 포함.
   */
  findMyTeams(
    userId: string,
    query: GetMyTeamsQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetMyTeamsResult>;

  /**
   * 팀 ID로 팀 상세 정보를 조회한다.
   * memberCount와 teamLeader 정보를 함께 반환.
   */
  findTeamById(
    teamId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<GetTeamResult | null>;

  /**
   * 팀 리더 권한 확인을 위해 팀과 팀의 현재 리더 BandMember.userId를 반환한다.
   */
  findTeamForLeaderCheck(
    teamId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    teamLeaderBandMemberId: string | null;
    teamLeaderUserId: string | null;
  } | null>;

  /**
   * 팀 정보(name, description, status, teamCoverUrl)를 수정한다.
   * 전달된 필드만 업데이트하는 partial update.
   */
  updateTeam(
    teamId: string,
    input: UpdateTeamInput,
    tx?: Prisma.TransactionClient,
  ): Promise<UpdateTeamResult>;

  /**
   * 팀 멤버 목록을 cursor 기반으로 조회한다.
   * BandMember → UserProfile(nickname, avatarUrl) join 포함.
   */
  findTeamMembersByTeamId(
    teamId: string,
    query: GetTeamMembersQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetTeamMembersResult>;

  /**
   * 팀 멤버 ID로 TeamMember를 조회한다.
   * 리더 변경/멤버 제거 시 대상 검증에 사용.
   */
  findTeamMemberById(
    teamMemberId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    teamId: string;
    bandMemberId: string;
    userId: string;         // BandMember.userId
    nickname: string;       // UserProfile.nickname
    teamRole: string;
  } | null>;

  /**
   * 팀의 리더를 변경한다.
   * Team.teamLeaderBandMemberId 업데이트 + 기존 리더의 TeamMember.teamRole → MEMBER
   * + 새 리더의 TeamMember.teamRole → LEADER를 하나의 트랜잭션으로 처리.
   */
  changeTeamLeader(
    teamId: string,
    newLeaderTeamMemberId: string,
    currentLeaderBandMemberId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ChangeTeamLeaderResult>;

  /**
   * 팀에서 멤버를 제거(delete)한다.
   */
  removeTeamMember(
    teamMemberId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RemoveTeamMemberResult>;

  /**
   * 밴드 멤버 ID로 BandMember를 조회한다.
   * 팀 멤버 추가 시 대상 검증에 사용.
   * bandId 파라미터로 해당 밴드의 멤버인지 함께 검증.
   */
  findBandMemberById(
    bandMemberId: string,
    bandId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; userId: string } | null>;

  /**
   * teamId + bandMemberId 조합으로 기존 TeamMember 존재 여부를 확인한다.
   * 중복 추가 방지에 사용.
   */
  findTeamMemberByTeamIdAndBandMemberId(
    teamId: string,
    bandMemberId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string } | null>;

  /**
   * 팀에 새 멤버를 추가한다. teamRole은 MEMBER로 고정.
   * BandMember → UserProfile join으로 user 정보 포함 반환.
   */
  addTeamMember(
    teamId: string,
    bandMemberId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<AddTeamMemberResult>;

  /**
   * 팀을 삭제한다. Team 레코드를 실제로 삭제(hard delete).
   * TeamMember는 onDelete: Cascade로 함께 삭제됨.
   */
  deleteTeam(
    teamId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DeleteTeamResult>;
}

export interface CreateTeamRepositoryInput {
  bandId: string;
  creatorBandMemberId: string;   // 생성자 BandMember.id (자동으로 리더가 됨)
  creatorUserId: string;         // 생성 응답의 teamLeaderUserId 반환용
  name: string;
  description?: string;
  teamCoverUrl?: string;
}
```

---

## Service 비즈니스 규칙

**파일:** `src/modules/teams/teams.service.ts`
**심볼:** `TEAMS_REPOSITORY`

### 공통 패턴

모든 Service 메서드는 `tx?: Prisma.TransactionClient`를 마지막 선택 인자로 받는다.
트랜잭션이 필요한 경우:

```typescript
const run = async (client: Prisma.TransactionClient) => { ... };
return tx ? run(tx) : this.prisma.$transaction(run);
```

---

### #53 createTeam(requesterUserId, bandId, input, tx?)

**API:** `POST /bands/{bandId}/teams`

처리 흐름:
1. `bandId`로 밴드 존재 확인 → 없거나 deletedAt이 있으면 `NotFoundException('요청한 밴드를 찾을 수 없습니다.')`
2. `bandId + requesterUserId`로 BandMember 조회 → 없으면 `ForbiddenException('밴드 멤버만 팀을 생성할 수 있습니다.')`
3. `teamsRepository.createTeam({ bandId, creatorBandMemberId: bandMember.id, creatorUserId: requesterUserId, ...input })` 호출
4. 결과 반환

트랜잭션 경계: 필요 (밴드 확인 + BandMember 확인 + Team/TeamMember 생성을 하나의 tx로)

---

### #54 getBandTeams(bandId, query, tx?)

**API:** `GET /bands/{bandId}/teams`

처리 흐름:
1. 쿼리 cursor 쌍 유효성 검증 (cursor__created_at, cursor__id 중 하나만 있으면 400)
2. `order__created_at !== order__id`이면 `BadRequestException`
3. `bandId`로 밴드 존재 확인 → 없으면 `NotFoundException`
4. `teamsRepository.findTeamsByBandId(bandId, query)` 호출
5. 결과 반환

트랜잭션 경계: 불필요 (읽기 전용, tx 전달만)

---

### #55 getMyTeams(requesterUserId, query, tx?)

**API:** `GET /teams/me`

처리 흐름:
1. 쿼리 cursor 쌍 유효성 검증 (cursor__joined_at, cursor__id)
2. `order__joined_at !== order__id`이면 `BadRequestException`
3. `teamsRepository.findMyTeams(requesterUserId, query)` 호출
4. 결과 반환

트랜잭션 경계: 불필요

---

### #60 getTeam(teamId, tx?)

**API:** `GET /teams/{teamId}`

처리 흐름:
1. `teamsRepository.findTeamById(teamId)` 호출
2. 결과가 null이면 `NotFoundException('요청한 팀을 찾을 수 없습니다.')`
3. 결과 반환

트랜잭션 경계: 불필요

---

### #61 updateTeam(requesterUserId, teamId, input, tx?)

**API:** `PATCH /teams/{teamId}`

처리 흐름:
1. input이 모두 undefined이면 `BadRequestException('수정할 팀 정보가 필요합니다.')`
2. `teamsRepository.findTeamForLeaderCheck(teamId)` 호출
3. 결과가 null이면 `NotFoundException('요청한 팀을 찾을 수 없습니다.')`
4. `team.teamLeaderUserId !== requesterUserId`이면 `ForbiddenException('팀 리더만 팀 정보를 수정할 수 있습니다.')`
5. `teamsRepository.updateTeam(teamId, input)` 호출
6. 결과 반환

트랜잭션 경계: 필요 (리더 확인 + 업데이트를 같은 tx로)

---

### #62 getTeamMembers(teamId, query, tx?)

**API:** `GET /teams/{teamId}/members`

처리 흐름:
1. 쿼리 cursor 쌍 유효성 검증 (cursor__joined_at, cursor__id)
2. `order__joined_at !== order__id`이면 `BadRequestException`
3. `teamsRepository.findTeamForLeaderCheck(teamId)` 호출 (팀 존재 확인 목적)
4. 결과가 null이면 `NotFoundException('요청한 팀을 찾을 수 없습니다.')`
5. `teamsRepository.findTeamMembersByTeamId(teamId, query)` 호출
6. 결과 반환

트랜잭션 경계: 불필요

---

### #63 changeTeamLeader(requesterUserId, teamId, teamMemberId, tx?)

**API:** `PATCH /teams/{teamId}/leader`

처리 흐름:
1. `teamsRepository.findTeamForLeaderCheck(teamId)` 호출
2. 결과가 null이면 `NotFoundException('요청한 팀을 찾을 수 없습니다.')`
3. `team.teamLeaderUserId !== requesterUserId`이면 `ForbiddenException('팀 리더만 리더를 변경할 수 있습니다.')`
4. `teamsRepository.findTeamMemberById(teamMemberId)` 호출
5. 결과가 null이면 `NotFoundException('요청한 팀 멤버를 찾을 수 없습니다.')`
6. `targetTeamMember.teamId !== teamId`이면 `NotFoundException` (다른 팀의 teamMemberId 방지)
7. `targetTeamMember.teamRole === 'LEADER'`이면 이미 리더 — `BadRequestException('이미 팀 리더인 멤버입니다.')`
8. `teamsRepository.changeTeamLeader(teamId, teamMemberId, currentLeaderBandMemberId)` 호출
9. 결과 반환

트랜잭션 경계: 필요 (리더 확인 + 변경을 같은 tx로)

---

### #64 removeTeamMember(requesterUserId, teamId, teamMemberId, tx?)

**API:** `DELETE /teams/{teamId}/members/{teamMemberId}`

처리 흐름:
1. `teamsRepository.findTeamForLeaderCheck(teamId)` 호출
2. 결과가 null이면 `NotFoundException('요청한 팀을 찾을 수 없습니다.')`
3. `team.teamLeaderUserId !== requesterUserId`이면 `ForbiddenException('팀 리더만 멤버를 제거할 수 있습니다.')`
4. `teamsRepository.findTeamMemberById(teamMemberId)` 호출
5. 결과가 null이면 `NotFoundException('요청한 팀 멤버를 찾을 수 없습니다.')`
6. `targetTeamMember.teamId !== teamId`이면 `NotFoundException`
7. `targetTeamMember.userId === requesterUserId`이면 `BadRequestException('팀 리더는 자기 자신을 팀에서 제거할 수 없습니다. 리더를 먼저 변경하세요.')`
8. `teamsRepository.removeTeamMember(teamMemberId)` 호출
9. 결과 반환

트랜잭션 경계: 필요 (리더 확인 + 멤버 확인 + 삭제를 같은 tx로)

---

### #65 addTeamMember(requesterUserId, teamId, bandMemberId, tx?)

**API:** `POST /teams/{teamId}/members`

처리 흐름:
1. `teamsRepository.findTeamForLeaderCheck(teamId)` 호출
2. 결과가 null이면 `NotFoundException('요청한 팀을 찾을 수 없습니다.')`
3. `team.teamLeaderUserId !== requesterUserId`이면 `ForbiddenException('팀 리더만 멤버를 추가할 수 있습니다.')`
4. `teamsRepository.findBandMemberById(bandMemberId, team.bandId)` 호출
   - bandId는 findTeamForLeaderCheck 결과에 포함 → findTeamForLeaderCheck에 bandId 반환 필요 (추가 반환 필드)
5. 결과가 null이면 `NotFoundException('요청한 밴드 멤버를 찾을 수 없습니다.')`
6. `teamsRepository.findTeamMemberByTeamIdAndBandMemberId(teamId, bandMemberId)` 호출
7. 결과가 있으면 `ConflictException('이미 해당 팀의 멤버입니다.')`
8. `teamsRepository.addTeamMember(teamId, bandMemberId)` 호출
9. 결과 반환

트랜잭션 경계: 필요

**주의:** findTeamForLeaderCheck의 반환 타입에 `bandId: string`을 추가해야 한다.

---

### #66 deleteTeam(requesterUserId, teamId, tx?)

**API:** `DELETE /teams/{teamId}`

처리 흐름:
1. `teamsRepository.findTeamForLeaderCheck(teamId)` 호출
2. 결과가 null이면 `NotFoundException('요청한 팀을 찾을 수 없습니다.')`
3. `team.teamLeaderUserId !== requesterUserId`이면 `ForbiddenException('팀 리더만 팀을 삭제할 수 있습니다.')`
4. `teamsRepository.deleteTeam(teamId)` 호출
5. 결과 반환

트랜잭션 경계: 필요 (리더 확인 + 삭제를 같은 tx로)

---

## Controller 설계

**파일:** `src/modules/teams/teams.controller.ts`

Controller는 두 개의 경로 prefix를 처리해야 한다:
- `/bands/:bandId/teams` — #53, #54
- `/teams` — #55, #60, #61, #62, #63, #64, #65, #66

NestJS는 단일 Controller에 복수 prefix를 지원하지 않는다.
따라서 **Controller를 두 개로 분리**한다:

1. `BandTeamsController` — prefix: `bands` — #53, #54 담당
2. `TeamsController` — prefix: `teams` — #55, #60, #61, #62, #63, #64, #65, #66 담당

두 Controller 모두 `TeamsService`를 주입받는다.

### BandTeamsController

```typescript
@ApiTags('팀')
@Controller('bands')
export class BandTeamsController {
  @Post(':bandId/teams')
  @HttpCode(201)
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '팀 생성' })
  @ApiParam({ name: 'bandId', type: String })
  @ApiResponse({ status: 201, description: '팀 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '밴드 멤버가 아님' })
  @ApiResponse({ status: 404, description: '밴드 없음' })
  async createTeam(...): Promise<ApiSuccessResponse<CreateTeamResult>>

  @Get(':bandId/teams')
  @ApiOperation({ summary: '밴드 팀 목록 조회' })
  @ApiParam({ name: 'bandId', type: String })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '밴드 없음' })
  async getBandTeams(...): Promise<ApiSuccessResponse<GetBandTeamsResult>>
}
```

### TeamsController

```typescript
@ApiTags('팀')
@Controller('teams')
export class TeamsController {
  @Get('me')           // #55 — @UseGuards(AccessTokenGuard)
  @Get(':teamId')      // #60 — public
  @Patch(':teamId')    // #61 — @UseGuards(AccessTokenGuard)
  @Get(':teamId/members')  // #62 — public
  @Patch(':teamId/leader') // #63 — @UseGuards(AccessTokenGuard)
  @Delete(':teamId/members/:teamMemberId') // #64 — @UseGuards(AccessTokenGuard)
  @Post(':teamId/members') // #65 — @UseGuards(AccessTokenGuard)
  @Delete(':teamId')   // #66 — @UseGuards(AccessTokenGuard)
}
```

**주의:** `GET /teams/me`와 `GET /teams/:teamId`가 충돌하지 않도록 `me` 핸들러를 `:teamId` 핸들러보다 **먼저** 선언해야 한다.

---

## Repository 인터페이스 보완: findTeamForLeaderCheck 반환 타입

#65 설계에서 `bandId`가 필요하므로 아래로 확정한다:

```typescript
findTeamForLeaderCheck(
  teamId: string,
  tx?: Prisma.TransactionClient,
): Promise<{
  id: string;
  bandId: string;
  teamLeaderBandMemberId: string | null;
  teamLeaderUserId: string | null;   // BandMember.userId (join 필요)
} | null>;
```

---

## 트랜잭션 경계 요약

| 메서드 | tx 필요 | 이유 |
|--------|:-------:|------|
| createTeam | ✅ | 밴드/멤버 확인 + Team/TeamMember 생성 원자성 |
| getBandTeams | 없음 | 읽기 전용 |
| getMyTeams | 없음 | 읽기 전용 |
| getTeam | 없음 | 읽기 전용 |
| updateTeam | ✅ | 리더 확인 + 업데이트 원자성 |
| getTeamMembers | 없음 | 읽기 전용 |
| changeTeamLeader | ✅ | 리더 확인 + Team/TeamMember 3개 업데이트 원자성 |
| removeTeamMember | ✅ | 리더 확인 + 멤버 확인 + 삭제 원자성 |
| addTeamMember | ✅ | 리더/멤버 확인 + 중복 확인 + 추가 원자성 |
| deleteTeam | ✅ | 리더 확인 + 삭제 원자성 |

---

## 테스트 계획

**파일:** `src/modules/teams/teams.service.spec.ts`
**패턴:** 손으로 만든 Repository Stub (TestingModule, jest.fn() 금지)

### UUID 상수 (파일 상단 선언)

```typescript
const USER_ID         = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID   = '22222222-2222-4222-8222-222222222222';
const BAND_ID         = '33333333-3333-4333-8333-333333333333';
const TEAM_ID         = '44444444-4444-4444-8444-444444444444';
const BAND_MEMBER_ID  = '55555555-5555-4555-8555-555555555555';
const TEAM_MEMBER_ID  = '66666666-6666-4666-8666-666666666666';
const OTHER_BAND_MEMBER_ID = '77777777-7777-4777-8777-777777777777';
const OTHER_TEAM_MEMBER_ID = '88888888-8888-4888-8888-888888888888';
```

### 테스트 케이스 목록

| 메서드 | 케이스 | 기대 결과 |
|--------|--------|-----------|
| createTeam | happy path | CreateTeamResult 반환 |
| createTeam | 밴드 없음 | NotFoundException |
| createTeam | 밴드 멤버 아님 | ForbiddenException |
| createTeam | tx 일관성 | capturedTransactions 동일 client 확인 |
| createTeam | 외부 tx 전달 | createPrismaServiceFailingTransactionStub |
| getBandTeams | happy path | GetBandTeamsResult 반환 |
| getBandTeams | 밴드 없음 | NotFoundException |
| getBandTeams | cursor 한쪽만 입력 | BadRequestException |
| getBandTeams | order 방향 불일치 | BadRequestException |
| getMyTeams | happy path | GetMyTeamsResult 반환 |
| getMyTeams | cursor 한쪽만 입력 | BadRequestException |
| getMyTeams | order 방향 불일치 | BadRequestException |
| getTeam | happy path | GetTeamResult 반환 |
| getTeam | 팀 없음 | NotFoundException |
| updateTeam | happy path | UpdateTeamResult 반환 |
| updateTeam | 팀 없음 | NotFoundException |
| updateTeam | 팀 리더 아님 | ForbiddenException |
| updateTeam | 수정 필드 없음 | BadRequestException |
| updateTeam | tx 일관성 | capturedTransactions 동일 client 확인 |
| updateTeam | 외부 tx 전달 | createPrismaServiceFailingTransactionStub |
| getTeamMembers | happy path | GetTeamMembersResult 반환 |
| getTeamMembers | 팀 없음 | NotFoundException |
| getTeamMembers | cursor 한쪽만 입력 | BadRequestException |
| changeTeamLeader | happy path | ChangeTeamLeaderResult 반환 |
| changeTeamLeader | 팀 없음 | NotFoundException |
| changeTeamLeader | 팀 리더 아님 | ForbiddenException |
| changeTeamLeader | 팀 멤버 없음 | NotFoundException |
| changeTeamLeader | 이미 리더 | BadRequestException |
| changeTeamLeader | tx 일관성 | capturedTransactions 동일 client 확인 |
| changeTeamLeader | 외부 tx 전달 | createPrismaServiceFailingTransactionStub |
| removeTeamMember | happy path | RemoveTeamMemberResult 반환 |
| removeTeamMember | 팀 없음 | NotFoundException |
| removeTeamMember | 팀 리더 아님 | ForbiddenException |
| removeTeamMember | 팀 멤버 없음 | NotFoundException |
| removeTeamMember | 자기 자신 제거 | BadRequestException |
| removeTeamMember | tx 일관성 | capturedTransactions 동일 client 확인 |
| removeTeamMember | 외부 tx 전달 | createPrismaServiceFailingTransactionStub |
| addTeamMember | happy path | AddTeamMemberResult 반환 |
| addTeamMember | 팀 없음 | NotFoundException |
| addTeamMember | 팀 리더 아님 | ForbiddenException |
| addTeamMember | 밴드 멤버 없음 (해당 밴드) | NotFoundException |
| addTeamMember | 이미 팀 멤버 | ConflictException |
| addTeamMember | tx 일관성 | capturedTransactions 동일 client 확인 |
| addTeamMember | 외부 tx 전달 | createPrismaServiceFailingTransactionStub |
| deleteTeam | happy path | DeleteTeamResult 반환 |
| deleteTeam | 팀 없음 | NotFoundException |
| deleteTeam | 팀 리더 아님 | ForbiddenException |
| deleteTeam | tx 일관성 | capturedTransactions 동일 client 확인 |
| deleteTeam | 외부 tx 전달 | createPrismaServiceFailingTransactionStub |

### Stub 구조 (핵심)

```typescript
function createTeamsRepositoryStub(options?: {
  band?: { id: string } | null;
  bandMember?: { id: string } | null;
  team?: { id: string; bandId: string; teamLeaderBandMemberId: string | null; teamLeaderUserId: string | null } | null;
  teamMember?: { id: string; teamId: string; bandMemberId: string; userId: string; nickname: string; teamRole: string } | null;
  existingTeamMember?: { id: string } | null;
  onCreateTeam?: (input: CreateTeamRepositoryInput, tx: unknown) => void;
  onChangeTeamLeader?: (teamId: string, newLeaderTeamMemberId: string, currentLeaderBandMemberId: string, tx: unknown) => void;
}): TeamsRepository {
  return {
    async findActiveBandById() { return options?.band !== undefined ? options.band : { id: BAND_ID }; },
    async findBandMemberByBandIdAndUserId() { return options?.bandMember !== undefined ? options.bandMember : { id: BAND_MEMBER_ID }; },
    async findTeamForLeaderCheck() { return options?.team !== undefined ? options.team : DEFAULT_TEAM; },
    async createTeam(input, tx) {
      options?.onCreateTeam?.(input, tx);
      return DEFAULT_CREATE_TEAM_RESULT;
    },
    // ... 나머지 메서드
  };
}
```

---

## 미결 사항

1. **Team soft delete 여부:** 현재 `Team` 모델에 `deletedAt`이 없다. 설계에서는 hard delete로 처리한다. 향후 soft delete가 필요하면 스키마 변경 필요.

2. **밴드 삭제 시 팀 처리:** `Band → Team`이 `onDelete: Cascade`로 설정되어 있어 밴드 삭제 시 팀도 cascade 삭제된다. teams 모듈에서는 별도 처리 불필요.

3. **`#53` 응답 `teamLeaderUserId` 필드:** API 명세의 응답 필드명이 `teamLeaderUserId`이나 이는 BandMember를 join해서 얻는 값이다. 명세를 준수해 join 후 반환하도록 설계함.

4. **팀 리더 권한 확인 방법:** 현재 설계에서는 `findTeamForLeaderCheck`가 `teamLeaderUserId`(BandMember.userId)를 반환하고, Service에서 `requesterUserId`와 비교한다. BandMember join이 필요하므로 Prisma 쿼리에 `include: { teamLeaderBandMember: { select: { userId: true } } }` 패턴이 필요하다.

5. **`GET /teams/me` cursor의 id 필드:** 명세상 cursor.id가 `last-team-member-id` (TeamMember.id)이다. 이 설계는 TeamMember.id를 cursor로 사용한다.
