# ProfileMusic 메타데이터 저장/조회 설계

## API 번호

- #68 `GET /users/profile-music/search` — 신규 (기존 최대 #7 기준, Notion 번호 그대로 적용)
- #69 `DELETE /users/:userId/profile-music` — 신규
- #3 `GET /users/:userId/profiles` — 기존 업데이트 (`profileMusicUrl` → `profileMusic`)
- #5 `PATCH /users/:userId/profiles` — 기존 업데이트 (`profileMusicUrl` → `profileMusic` upsert)

명세 위치: `docs/backend/api-docs/users.md`

---

## 작업 범위

### 스키마 변경 (prisma/schema.prisma)

```text
수정: prisma/schema.prisma
  - UserProfile.profileMusicUrl 필드 제거
  - User 모델에 `profileMusic ProfileMusic?` 관계 추가
  - ProfileMusic 모델 신규 추가
```

### 신규 파일

```text
신규: src/modules/users/repositories/profile-music.repository.ts
      src/modules/users/repositories/profile-music.prisma-repository.ts
      src/modules/users/dto/search-profile-music-query.dto.ts
      src/modules/users/dto/profile-music-track.dto.ts
      src/modules/users/types/profile-music.type.ts
```

### 수정 파일

```text
수정: src/modules/users/types/user-profile.type.ts
        UserProfileDetail.profileMusicUrl 제거
        UserProfileDetail에 profileMusic: ProfileMusicTrack | null 추가

수정: src/modules/users/dto/update-user-profile.dto.ts
        UpdateProfileDto.profileMusicUrl 제거
        UpdateProfileDto에 profileMusic?: ProfileMusicTrackDto | null 추가

수정: src/modules/users/repositoreis/user.repository.ts
        (기존 오타 경로 그대로 유지)
        UpdateUserProfileData 타입에 profile.profileMusic 반영됨 (DTO 변경으로 연동)

수정: src/modules/users/repositoreis/user.prisma-repository.ts
        findUserProfileById — profileMusic 관계 include 추가, 응답 매핑 수정
        updateUserProfile — profileMusic upsert 로직 추가

수정: src/modules/users/users.service.ts
        searchProfileMusic 메서드 추가
        deleteProfileMusic 메서드 추가
        DeezerTrackClient 주입 추가

수정: src/modules/users/users.controller.ts
        GET /users/profile-music/search 핸들러 추가
        DELETE /users/:userId/profile-music 핸들러 추가

수정: src/modules/users/users.module.ts
        ProfileMusicPrismaRepository provider 등록
        PROFILE_MUSIC_REPOSITORY 심볼 등록
        DeezerTrackClient provider 등록
        SongsModule import 또는 DeezerTrackClient 직접 등록

수정: src/modules/users/users.service.spec.ts
        searchProfileMusic / deleteProfileMusic 테스트 추가
        mockProfile profileMusicUrl → profileMusic 교체
```

---

## 스키마 설계

### 추가할 ProfileMusic 모델

```prisma
model ProfileMusic {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @unique @map("user_id") @db.Uuid
  trackData Json     @map("track_data") @db.JsonB
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profile_music")
}
```

### User 모델 변경

```prisma
// 추가
profileMusic ProfileMusic?
```

### UserProfile 모델 변경

```prisma
// 제거
profileMusicUrl String? @map("profile_music_url")
```

---

## 타입 정의

### ProfileMusicTrack (types/profile-music.type.ts)

```typescript
/** 프로필 음악 트랙 데이터 구조 — JSONB trackData 컬럼에 저장되는 형태와 동일 */
export interface ProfileMusicTrack {
  externalTrackId: string;
  sourceType: 'DEEZER';
  title: string;
  artistName: string;
  albumName: string;
  albumImageUrl: string | null;
  durationMs: number;
  previewUrl: string | null;
  sourceUrl: string;
}

/** #69 삭제 응답 */
export interface DeleteProfileMusicResult {
  userId: string;
  deletedAt: string;
}
```

### UserProfileDetail 변경 (types/user-profile.type.ts)

```typescript
export interface UserProfileDetail {
  nickname: string;
  selfDescription: string | null;
  // profileMusicUrl 제거
  avatarUrl: string | null;
  profileMusic: ProfileMusicTrack | null;  // 추가
}
```

---

## Repository 인터페이스

### 신규: PROFILE_MUSIC_REPOSITORY (repositories/profile-music.repository.ts)

```typescript
export const PROFILE_MUSIC_REPOSITORY = Symbol('PROFILE_MUSIC_REPOSITORY');

export interface ProfileMusicRepository {
  /**
   * userId로 ProfileMusic 레코드를 조회한다.
   * 존재하지 않으면 null을 반환한다.
   */
  findByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<ProfileMusicTrack | null>;

  /**
   * ProfileMusic을 upsert한다.
   * userId 기준으로 이미 존재하면 trackData를 업데이트하고,
   * 없으면 신규 생성한다.
   */
  upsertByUserId(userId: string, trackData: ProfileMusicTrack, tx?: Prisma.TransactionClient): Promise<ProfileMusicTrack>;

  /**
   * userId로 ProfileMusic을 삭제하고 삭제 시각을 반환한다.
   * 레코드가 없으면 null을 반환한다.
   */
  deleteByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<DeleteProfileMusicResult | null>;
}
```

### 기존 UsersRepository 변경 없음

`findUserProfileById`와 `updateUserProfile`의 시그니처는 변경 없다. 내부 구현(Prisma 쿼리)만 바뀐다.

- `findUserProfileById`: `include: { profileMusic: true }` 추가 후 `mapProfileMusic` 헬퍼로 변환
- `updateUserProfile`: `data.profile.profileMusic`이 존재하면 `PROFILE_MUSIC_REPOSITORY`의 `upsertByUserId` 호출

단, `updateUserProfile`이 `ProfileMusicRepository`를 직접 사용하면 Repository → Repository 의존이 생긴다. 이 경우 upsert 로직을 `UsersPrismaRepository` 내에서 `tx`를 통해 직접 Prisma 쿼리로 처리하는 방식을 채택한다(아래 "Service 비즈니스 규칙" 참고).

---

## DTO 정의

### ProfileMusicTrackDto (dto/profile-music-track.dto.ts)

```typescript
export class ProfileMusicTrackDto {
  @ApiProperty({ description: '외부 트랙 ID', example: '12345' })
  @IsString({ message: stringValidationMessage })
  externalTrackId!: string;

  @ApiProperty({ description: '소스 타입', example: 'DEEZER' })
  @IsIn(['DEEZER'])
  sourceType!: 'DEEZER';

  @ApiProperty({ description: '곡 제목', example: 'Blinding Lights' })
  @IsString({ message: stringValidationMessage })
  title!: string;

  @ApiProperty({ description: '아티스트명', example: 'The Weeknd' })
  @IsString({ message: stringValidationMessage })
  artistName!: string;

  @ApiProperty({ description: '앨범명', example: 'After Hours' })
  @IsString({ message: stringValidationMessage })
  albumName!: string;

  @ApiPropertyOptional({ description: '앨범 이미지 URL', example: 'https://example.com/album.jpg' })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  albumImageUrl?: string | null;

  @ApiProperty({ description: '재생 시간 (밀리초)', example: 200000 })
  @IsInt()
  durationMs!: number;

  @ApiPropertyOptional({ description: '미리 듣기 URL', example: 'https://cdns-preview.dzcdn.net/...' })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  previewUrl?: string | null;

  @ApiProperty({ description: '소스 URL', example: 'https://www.deezer.com/track/12345' })
  @IsString({ message: stringValidationMessage })
  sourceUrl!: string;
}
```

### SearchProfileMusicQueryDto (dto/search-profile-music-query.dto.ts)

```typescript
export class SearchProfileMusicQueryDto {
  @ApiProperty({ description: '검색어 (곡명, 아티스트명)', example: 'Blinding Lights' })
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: '검색어를 입력해 주세요.' })
  q!: string;
}
```

### UpdateProfileDto 변경 (dto/update-user-profile.dto.ts)

```typescript
class UpdateProfileDto {
  // 기존 nickname, selfDescription, avatarUrl 유지

  // 제거:
  // profileMusicUrl?: string;

  // 추가:
  @ApiPropertyOptional({ description: '프로필 음악 정보. 전달 시 upsert, 미전달 시 변경 없음. null 전달 시에도 변경 없음.' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileMusicTrackDto)
  profileMusic?: ProfileMusicTrackDto | null;
}
```

---

## Service 비즈니스 규칙

### searchProfileMusic(query: string, tx?: Prisma.TransactionClient): Promise<{ items: ProfileMusicTrack[] }>

```text
1. DeezerTrackClient.searchTracks(query) 호출
2. 결과를 parseDeezerTrackToProfileMusicTrack 헬퍼(또는 인라인 매핑)로 변환
   - SongPreview.releaseDate 필드는 ProfileMusicTrack에 없으므로 제외
   - sourceType은 'DEEZER'로 고정
3. { items: ProfileMusicTrack[] } 반환

예외: Deezer API 장애 → DeezerTrackClient 내부에서 BadGatewayException 발생 (Service는 별도 처리 없음)
```

> 참고: `parseDeezerTrackToSongPreview` 파서(songs 모듈)와 로직이 거의 동일하지만 반환 타입이 다르다. `releaseDate`가 `ProfileMusicTrack`에 없으므로 공유 파서를 억지로 재사용하지 않고 별도 변환 함수를 UsersService 내 private 메서드로 정의한다.

### deleteProfileMusic(userId: string, tx?: Prisma.TransactionClient): Promise<DeleteProfileMusicResult>

```text
1. profileMusicRepository.deleteByUserId(userId, tx) 호출
2. 반환값이 null → NotFoundException('프로필 음악이 존재하지 않습니다.')
3. 결과 반환
```

### updateUserProfile 변경 사항

기존 `updateUserProfile`에서 `data.profile.profileMusic` 처리를 추가한다.

```text
기존 흐름에서 profile 업데이트 단계:
  - userProfile.update()에 profileMusicUrl 포함 → 제거
  - data.profile.profileMusic이 truthy(null이 아니고 undefined가 아님)이면:
      client.profileMusic.upsert({
        where: { userId },
        create: { userId, trackData: data.profile.profileMusic },
        update: { trackData: data.profile.profileMusic },
      })

profileMusic: null 또는 undefined → 아무 처리 없음
```

Prisma upsert를 `UsersPrismaRepository.updateUserProfile` 내부에서 직접 처리한다(tx 인자 재사용). `ProfileMusicRepository`는 삭제(deleteByUserId)와 독립 조회에만 사용한다.

### getUserProfile 변경 사항

`findUserProfileById` 내부에서 `profileMusic` 관계를 include한 뒤 응답 매핑에 포함. Service 로직 변경 없음.

---

## Controller 메서드 설계

### GET /users/profile-music/search (#68)

```typescript
@Get('profile-music/search')
@ApiOperation({ summary: '프로필 음악 검색' })
@ApiResponse({ status: 200, description: '프로필 음악 검색 성공' })
@ApiResponse({ status: 400, description: '검색어(q) 누락' })
async searchProfileMusic(
  @Query() query: SearchProfileMusicQueryDto,
): Promise<ApiSuccessResponse<{ items: ProfileMusicTrack[] }>>
```

> 주의: 경로가 `/users/profile-music/search`이고 `:userId` 파라미터 라우트보다 위에 선언되어야 NestJS 라우터가 `profile-music`을 userId로 오인하지 않는다. NestJS는 선언 순서대로 매칭하므로 Controller 상단에 배치한다.

### DELETE /users/:userId/profile-music (#69)

```typescript
@Delete(':userId/profile-music')
@UseGuards(AccessTokenGuard, SelfUserGuard)
@ApiBearerAuth('access-token')
@ApiOperation({ summary: '프로필 음악 삭제' })
@ApiParam({ name: 'userId', description: '유저 ID (UUID)', type: String })
@ApiResponse({ status: 200, description: '프로필 음악 삭제 성공' })
@ApiResponse({ status: 401, description: '인증 실패' })
@ApiResponse({ status: 403, description: '본인 프로필 음악만 삭제 가능' })
@ApiResponse({ status: 404, description: '프로필 음악이 존재하지 않음' })
async deleteProfileMusic(
  @Param('userId', ParseUUIDPipe) userId: string,
): Promise<ApiSuccessResponse<DeleteProfileMusicResult>>
```

---

## ProfileMusicPrismaRepository 구현 설계

### findByUserId

```typescript
const record = await client.profileMusic.findUnique({ where: { userId } });
if (!record) return null;
return record.trackData as ProfileMusicTrack;
```

### upsertByUserId

```typescript
const record = await client.profileMusic.upsert({
  where: { userId },
  create: { userId, trackData: trackData as Prisma.InputJsonValue },
  update: { trackData: trackData as Prisma.InputJsonValue },
});
return record.trackData as ProfileMusicTrack;
```

### deleteByUserId

```typescript
try {
  await client.profileMusic.delete({ where: { userId } });
  return { userId, deletedAt: new Date().toISOString() };
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
    return null;
  }
  throw e;
}
```

---

## 트랜잭션 경계

| 메서드 | tx? 이유 |
|--------|----------|
| `UsersService.searchProfileMusic` | DB 접근 없음. tx 불필요하나 시그니처 통일을 위해 tx? 포함 |
| `UsersService.deleteProfileMusic` | 단일 delete이므로 자체 트랜잭션 불필요. 외부 tx 전달만 지원 |
| `UsersService.updateUserProfile` | 기존 메서드 — 내부에서 `prisma.$transaction` 사용. profileMusic upsert를 동일 tx 안에서 처리 |
| `ProfileMusicPrismaRepository.*` | 모든 메서드가 `tx?` 인자 수용 |

`updateUserProfile` 트랜잭션 처리 패턴:

```typescript
const run = async (client: Prisma.TransactionClient) => {
  // 기존 profile/skills/genres 처리
  // + profileMusic upsert (data.profile.profileMusic 있을 때만)
};
return tx ? run(tx) : this.prisma.$transaction(run);
```

---

## 모듈 변경 (users.module.ts)

```typescript
import { DeezerTrackClient } from '../songs/deezer-track.client';
import { ProfileMusicPrismaRepository } from './repositories/profile-music.prisma-repository';
import { PROFILE_MUSIC_REPOSITORY } from './repositories/profile-music.repository';

@Module({
  providers: [
    // 기존 유지
    UsersService,
    AccessTokenGuard,
    SelfUserGuard,
    { provide: USERS_REPOSITORY, useClass: UsersPrismaRepository },
    // 추가
    DeezerTrackClient,
    ProfileMusicPrismaRepository,
    { provide: PROFILE_MUSIC_REPOSITORY, useClass: ProfileMusicPrismaRepository },
  ],
  // ...
})
```

> `DeezerTrackClient`는 SongsModule에 등록되어 있지만 exports되지 않는다. UsersModule에서 직접 providers에 추가한다.

---

## UsersService 의존성 변경

```typescript
@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(PROFILE_MUSIC_REPOSITORY)
    private readonly profileMusicRepository: ProfileMusicRepository,
    @Inject(DeezerTrackClient)
    private readonly deezerTrackClient: DeezerTrackClient,
    // prisma는 tx 진입점으로 직접 사용하지 않음 (updateUserProfile은 usersRepository 내부에서 처리)
  ) {}
}
```

> `updateUserProfile` 내부의 profileMusic upsert는 `UsersPrismaRepository`가 prisma client를 통해 직접 처리한다. Service는 Repository 인터페이스에만 의존한다는 원칙을 유지하기 위해, UsersPrismaRepository에 profileMusic upsert를 위임한다. 따라서 UsersService에는 PrismaService를 주입하지 않는다.

---

## 테스트 계획

### users.service.spec.ts — 신규 테스트 케이스

repositoryStub에 `profileMusicRepository` stub 추가:

```typescript
const profileMusicRepositoryStub: ProfileMusicRepository = {
  async findByUserId(userId) { return userId === 'user-001' ? mockProfileMusicTrack : null; },
  async upsertByUserId(_userId, trackData) { return trackData; },
  async deleteByUserId(userId) { return userId === 'user-001' ? { userId, deletedAt: '2026-06-26T00:00:00.000Z' } : null; },
};
```

DeezerTrackClient stub:

```typescript
const deezerTrackClientStub = {
  async searchTracks(_query: string) { return [mockDeezerTrackApiResponse]; },
};
```

| 메서드 | 케이스 | 검증 |
|--------|--------|------|
| `searchProfileMusic` | happy path | `{ items: [...] }` 반환, items 길이 ≥ 1 |
| `searchProfileMusic` | Deezer API 실패 | DeezerTrackClient가 BadGatewayException throw → Service도 그대로 전파 |
| `searchProfileMusic` | tx 전달 | `deezerTrackClient.searchTracks`에 tx 영향 없음 (외부 API) |
| `deleteProfileMusic` | happy path | `{ userId, deletedAt }` 반환 |
| `deleteProfileMusic` | 프로필 음악 없음 | `NotFoundException` |
| `deleteProfileMusic` | tx 전달 | `profileMusicRepository.deleteByUserId`에 동일 tx 전달 |

### mockProfile 수정

```typescript
// 기존
profile: { nickname: 'testuser', selfDescription: null, profileMusicUrl: null, avatarUrl: null }

// 변경
profile: { nickname: 'testuser', selfDescription: null, avatarUrl: null, profileMusic: null }
```

### updateUserProfile 기존 테스트 영향 없음

`updateUserProfile` stub 반환값(`mockProfile`)이 변경되므로 기존 테스트 통과 확인 필요. stub 값만 업데이트.

---

## 설계 품질 기준 체크리스트

- [x] Service 메서드마다 예외 조건이 명시되었는가?
  - `searchProfileMusic`: BadGatewayException (Deezer 장애, DeezerTrackClient 내부)
  - `deleteProfileMusic`: NotFoundException (프로필 음악 없음)
- [x] Repository 메서드가 인터페이스에 선언되었는가?
  - `ProfileMusicRepository`: findByUserId / upsertByUserId / deleteByUserId
- [x] 트랜잭션 경계가 명확한가?
  - updateUserProfile: prisma.$transaction 내 profileMusic upsert 포함
  - deleteProfileMusic: 외부 tx 전달만 지원
- [x] 테스트 케이스가 happy path + NotFoundException + BadGatewayException + tx 일관성 + 외부 tx를 포함하는가?
- [x] Prisma 모델과 설계가 일치하는가?
  - ProfileMusic 모델 구조 = 확정 스키마와 동일
  - UserProfile.profileMusicUrl 제거 반영
- [x] DTO 필드에 `@ApiProperty`가 포함되었는가?
  - ProfileMusicTrackDto, SearchProfileMusicQueryDto, UpdateProfileDto 모두 포함
- [x] Controller 메서드에 `@ApiOperation`, `@ApiResponse` 데코레이터가 포함되었는가?
  - #68, #69 핸들러 모두 포함
- [x] 작업 대상 API의 `#N` 번호가 명시되었는가?
  - #68, #69, #3(업데이트), #5(업데이트)

---

## 미결 사항

없음. 확정된 API 명세와 스키마를 기반으로 모든 항목이 결정되었다.

## 정정 (2026-09-06)

구현이 `profileMusic`을 `GetUserProfileResult` 최상위에 두었으나, 설계(§ UserProfileDetail에 `profileMusic` 추가)와 프론트 계약은 `profile.profileMusic`이다. 프로필 페이지가 zod 파싱 실패로 "존재하지 않는 유저 프로필입니다"를 띄운 원인이라, `UserProfileDetail.profileMusic`으로 옮겨 수정 요청(`profile.profileMusic`)과 응답 형태를 통일했다. api-docs #4 응답 예시도 함께 정정했다.
