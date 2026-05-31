# 설계 문서: 프로필 음악 메타데이터 저장/조회 기능

**날짜:** 2026-05-31
**API 명세 위치:** `docs/backend/api-docs/users.md`

---

## 0. 배경 및 결정 사항

### DB 스키마 방식 결정: inline 컬럼 방식 채택

UserProfile에 별도 모델(`UserProfileMusic`) 없이 inline 컬럼으로 프로필 음악 메타데이터를 저장한다.

**이유:**
- 프로필 음악은 UserProfile과 1:1 관계 — 별도 테이블이 JOIN만 추가할 뿐 이점 없음
- 필드 수(9개)가 많지 않고, 음악 메타데이터 전체를 항상 함께 조회/저장함
- 기존 inline 컬럼 패턴(`profileMusicUrl`)과 일관성 유지

### profileMusicSourceType enum 정의

스키마에 신규 enum `ProfileMusicSourceType`을 추가한다. 현재는 `DEEZER`만 필요하지만 enum으로 관리해 확장성을 확보한다.

---

## 1. 작업 범위

```
신규:
- src/modules/users/dto/profile-music.dto.ts          (ProfileMusicDto — 요청/응답 공용 nested DTO)
- src/modules/users/dto/search-profile-music-query.dto.ts  (GET 쿼리 DTO)
- src/modules/users/types/profile-music-preview.type.ts    (ProfileMusicPreview 타입)

수정:
- prisma/schema.prisma
    - UserProfile.profileMusicUrl 제거
    - UserProfile에 profileMusic* 컬럼 9개 추가
    - enum ProfileMusicSourceType 추가 (DEEZER)
- src/modules/users/dto/update-user-profile.dto.ts
    - UpdateProfileDto.profileMusicUrl 제거
    - UpdateProfileDto.profileMusic?: ProfileMusicDto 추가
- src/modules/users/types/user-profile.type.ts
    - UserProfileDetail.profileMusicUrl 제거
    - UserProfileDetail.profileMusic 추가 (ProfileMusicDetail | null)
- src/modules/users/repositoreis/user.repository.ts
    - searchProfileMusicPreviews(query: string, tx?) 메서드 시그니처 추가
- src/modules/users/repositoreis/user.prisma-repository.ts
    - updateUserProfile의 profile 업데이트 시 profileMusic 처리 반영
    - findUserProfileById의 profile 매핑에서 profileMusic 반영
    - searchProfileMusicPreviews 구현 추가
- src/modules/users/users.service.ts
    - searchProfileMusicPreviews(query: string, tx?) 메서드 추가
    - DeezerTrackClient (또는 DeezerTrackSearcher 인터페이스) 주입 추가
- src/modules/users/users.controller.ts
    - GET /users/profile-music/search 엔드포인트 추가
- src/modules/users/users.module.ts
    - DeezerTrackClient provider 추가
    - SongsModule에서 import하거나 직접 등록 (아래 미결 사항 참고)
- src/modules/users/users.service.spec.ts
    - searchProfileMusicPreviews 테스트 케이스 추가
    - 기존 mockProfile의 profileMusicUrl 제거, profileMusic 필드로 교체

제거:
- src/modules/songs/songs.controller.ts 에서 GET /songs/deezer/tracks/search 엔드포인트 제거
  (songs.service.searchDeezerTrackPreviews는 다른 곳에서 사용되지 않으므로 함께 제거 가능 — 미결 사항 참고)
```

---

## 2. DB 스키마 변경 상세

### UserProfile 변경

```prisma
model UserProfile {
  userId                    String                   @id @map("user_id") @db.Uuid
  nickname                  String                   @db.VarChar(255)
  selfDescription           String?                  @map("self_description")
  // profileMusicUrl 제거
  profileMusicExternalTrackId  String?               @map("profile_music_external_track_id")
  profileMusicSourceType       ProfileMusicSourceType? @map("profile_music_source_type")
  profileMusicTitle            String?               @map("profile_music_title") @db.VarChar(255)
  profileMusicArtistName       String?               @map("profile_music_artist_name") @db.VarChar(255)
  profileMusicAlbumName        String?               @map("profile_music_album_name") @db.VarChar(255)
  profileMusicAlbumImageUrl    String?               @map("profile_music_album_image_url")
  profileMusicDurationMs       Int?                  @map("profile_music_duration_ms")
  profileMusicPreviewUrl       String?               @map("profile_music_preview_url")
  profileMusicSourceUrl        String?               @map("profile_music_source_url")
  avatarUrl                    String?               @map("avatar_url")
  updatedAt                    DateTime?             @map("updated_at") @db.Timestamptz(6)
  user                         User                  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

enum ProfileMusicSourceType {
  DEEZER
}
```

> **일관성 규칙:** 프로필 음악 필드는 all-or-nothing으로 저장한다. `profileMusicSourceType`이 null이면 나머지 필드도 모두 null로 간주한다. 업데이트 시 `profileMusic: null`이 전달되면 전체 9개 필드를 null로 초기화한다.

---

## 3. Repository 인터페이스 변경

```typescript
// src/modules/users/repositoreis/user.repository.ts 에 추가

import type { ProfileMusicPreview } from '../types/profile-music-preview.type';

export interface UsersRepository {
  // ... 기존 메서드 유지 ...

  /**
   * Deezer 검색 결과를 프로필 음악 미리보기 목록으로 반환한다.
   * 외부 API 호출만 수행하므로 tx는 실제로 사용되지 않으나, 컨벤션 통일을 위해 선언한다.
   */
  searchProfileMusicPreviews(
    query: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ProfileMusicPreview[]>;
}
```

> **설계 판단:** `searchProfileMusicPreviews`는 외부 API(Deezer)를 호출하는 로직이므로 Repository가 아닌 Service에 직접 두는 방법도 있다. 그러나 기존 songs 모듈은 DeezerTrackClient를 Service에 직접 주입해 사용한다. users 모듈도 같은 패턴을 따른다 — Repository에 넣지 않고 **Service에서 DeezerTrackClient를 직접 주입받아 사용**한다. 따라서 위 Repository 인터페이스 변경은 불필요하며, 아래 Service 설계를 따른다.

---

## 3. Service 비즈니스 규칙

### 3.1 searchProfileMusicPreviews(query, tx?)

```
1. query가 빈 문자열이면 BadRequestException("검색어를 입력해주세요.")
2. deezerTrackSearcher.searchTracks(query) 호출
3. 각 결과를 parseDeezerTrackToSongPreview로 변환 후 ProfileMusicPreview[] 반환
   - ProfileMusicPreview는 SongPreview에서 releaseDate 필드를 제외한 타입
4. Deezer API 실패 시 BadGatewayException은 DeezerTrackClient에서 이미 throw함 — 별도 처리 불필요
```

### 3.2 updateUserProfile(userId, data, tx?) — 기존 메서드 수정

```
기존 흐름 유지. 변경 사항:
- data.profile 처리 시 profileMusicUrl 대신 profileMusic 객체를 분해하여 UserProfile 컬럼에 매핑
- data.profile.profileMusic이 null로 전달되면 9개 필드를 모두 null로 초기화
- data.profile.profileMusic이 undefined이면 프로필 음악 필드를 변경하지 않음
```

### 3.3 getUserProfile(userId, tx?) — 기존 메서드, Repository 매핑만 변경

```
변경 없음. user-profile.type.ts의 UserProfileDetail 타입 변경에 따라
prisma-repository에서 profileMusicUrl 대신 profileMusic 객체를 조합하여 반환한다.
```

---

## 4. DTO 및 타입 정의

### 4.1 ProfileMusicDto (신규)

```typescript
// src/modules/users/dto/profile-music.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class ProfileMusicDto {
  @ApiProperty({ description: 'Deezer 트랙 ID', example: '123456789' })
  @IsString()
  externalTrackId!: string;

  @ApiProperty({ enum: ['DEEZER'], description: '음원 소스 타입', example: 'DEEZER' })
  @IsEnum(['DEEZER'])
  sourceType!: 'DEEZER';

  @ApiProperty({ description: '곡 제목', example: 'Bohemian Rhapsody' })
  @IsString()
  title!: string;

  @ApiProperty({ description: '아티스트 이름', example: 'Queen' })
  @IsString()
  artistName!: string;

  @ApiProperty({ description: '앨범 이름', example: 'A Night at the Opera' })
  @IsString()
  albumName!: string;

  @ApiPropertyOptional({ description: '앨범 커버 이미지 URL' })
  @IsOptional()
  @IsUrl()
  albumImageUrl?: string | null;

  @ApiProperty({ description: '곡 길이 (밀리초)', example: 354000 })
  @IsNumber()
  durationMs!: number;

  @ApiPropertyOptional({ description: '미리듣기 URL' })
  @IsOptional()
  @IsUrl()
  previewUrl?: string | null;

  @ApiProperty({ description: '원본 소스 URL', example: 'https://www.deezer.com/track/123456789' })
  @IsUrl()
  sourceUrl!: string;
}
```

### 4.2 UpdateProfileDto 수정 (update-user-profile.dto.ts 내 중첩 클래스)

```typescript
class UpdateProfileDto {
  @IsOptional() @IsString() nickname?: string;
  @IsOptional() @IsString() selfDescription?: string;

  // profileMusicUrl 필드 제거
  // 아래 추가:
  @ApiPropertyOptional({ description: '프로필 음악 메타데이터. null 전달 시 제거', type: ProfileMusicDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileMusicDto)
  profileMusic?: ProfileMusicDto | null;

  @IsOptional() @IsString() avatarUrl?: string;
}
```

### 4.3 SearchProfileMusicQueryDto (신규)

```typescript
// src/modules/users/dto/search-profile-music-query.dto.ts

export class SearchProfileMusicQueryDto {
  @ApiProperty({ description: '검색어 (곡명 또는 아티스트명)', example: 'Queen' })
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty()
  q!: string;
}
```

> **주의:** 기존 songs 모듈의 `SearchDeezerTrackPreviewsQueryDto`는 파라미터명이 `query`이나, API 명세는 `q`를 사용한다. 새 DTO는 API 명세를 따른다.

### 4.4 ProfileMusicPreview 타입 (신규)

```typescript
// src/modules/users/types/profile-music-preview.type.ts

// SongPreview와 동일하나 releaseDate 제외
// SongPreview를 직접 재사용하면 releaseDate: null | string이 응답에 포함됨
// API 명세에는 releaseDate가 없으므로 별도 타입 정의
export interface ProfileMusicPreview {
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
```

### 4.5 UserProfileDetail 타입 수정 (user-profile.type.ts)

```typescript
export interface ProfileMusicDetail {
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

export interface UserProfileDetail {
  nickname: string;
  selfDescription: string | null;
  // profileMusicUrl 제거
  profileMusic: ProfileMusicDetail | null;  // 추가
  avatarUrl: string | null;
}
```

---

## 5. Soft Delete 여부

- `UserProfile` 모델에는 `deletedAt`이 없다. Soft delete 조건 불필요.
- `User` 모델에는 `deletedAt`이 있다. `findUserProfileById`에서 이미 `where: { id: userId, deletedAt: null }` 조건을 사용 중 — 변경 없음.

---

## 6. 트랜잭션 경계

| 메서드 | tx 필요 여부 | 이유 |
|--------|:-----------:|------|
| searchProfileMusicPreviews | 불필요 | 외부 API 호출만 수행, DB 쓰기 없음 |
| updateUserProfile | 필요 (기존 유지) | 여러 테이블(userProfile, user, userSkill, favoriteGenre)을 원자적으로 처리 |
| findUserProfileById | 불필요 (기존 유지) | 읽기 전용 |

`updateUserProfile` 내 profileMusic 처리:

```typescript
// prisma-repository의 updateUserProfile run() 내부

if (data.profile) {
  const { profileMusic, ...restProfileData } = data.profile;

  const profileMusicData =
    profileMusic === null
      ? {
          // null이면 전체 초기화
          profileMusicExternalTrackId: null,
          profileMusicSourceType: null,
          profileMusicTitle: null,
          profileMusicArtistName: null,
          profileMusicAlbumName: null,
          profileMusicAlbumImageUrl: null,
          profileMusicDurationMs: null,
          profileMusicPreviewUrl: null,
          profileMusicSourceUrl: null,
        }
      : profileMusic !== undefined
        ? {
            profileMusicExternalTrackId: profileMusic.externalTrackId,
            profileMusicSourceType: profileMusic.sourceType,
            profileMusicTitle: profileMusic.title,
            profileMusicArtistName: profileMusic.artistName,
            profileMusicAlbumName: profileMusic.albumName,
            profileMusicAlbumImageUrl: profileMusic.albumImageUrl ?? null,
            profileMusicDurationMs: profileMusic.durationMs,
            profileMusicPreviewUrl: profileMusic.previewUrl ?? null,
            profileMusicSourceUrl: profileMusic.sourceUrl,
          }
        : {}; // undefined이면 변경 없음

  await client.userProfile.update({
    where: { userId },
    data: { ...restProfileData, ...profileMusicData },
  });
}
```

---

## 7. UsersService — DeezerTrackClient 주입

기존 songs 모듈 패턴을 따라 `DeezerTrackClient`를 직접 주입받는다.

```typescript
// users.service.ts

import { DeezerTrackClient, type DeezerTrackSearcher } from '../songs/deezer-track.client';
import { parseDeezerTrackToSongPreview } from '../songs/deezer-track.parser';
import type { ProfileMusicPreview } from './types/profile-music-preview.type';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(DeezerTrackClient)
    private readonly deezerTrackSearcher: DeezerTrackSearcher,
  ) {}

  /**
   * Deezer에서 프로필 음악 후보를 검색한다.
   *
   * @param {string} query - 검색어 (곡명 또는 아티스트명)
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client (외부 API 호출이므로 실제 미사용)
   * @returns {Promise<ProfileMusicPreview[]>} 프로필 음악 후보 목록
   */
  async searchProfileMusicPreviews(query: string, tx?: Prisma.TransactionClient): Promise<ProfileMusicPreview[]> {
    if (!query.trim()) {
      throw new BadRequestException('검색어를 입력해주세요.');
    }
    const deezerTracks = await this.deezerTrackSearcher.searchTracks(query);
    return deezerTracks.map(track => {
      const preview = parseDeezerTrackToSongPreview(track);
      // releaseDate 제외
      const { releaseDate: _, ...profileMusicPreview } = preview;
      return profileMusicPreview as ProfileMusicPreview;
    });
  }
}
```

> **참고:** `parseDeezerTrackToSongPreview`는 songs 모듈 내부 함수이므로 import 경로는 `../songs/deezer-track.parser`가 된다. 모듈 경계를 넘는 유틸 import다 — 미결 사항 참고.

---

## 8. Controller 변경

```typescript
// users.controller.ts에 추가

import { SearchProfileMusicQueryDto } from './dto/search-profile-music-query.dto';
import type { ProfileMusicPreview } from './types/profile-music-preview.type';

@Get('profile-music/search')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth('access-token')
@ApiOperation({ summary: '프로필 음악 검색' })
@ApiResponse({ status: 200, description: '프로필 음악 검색 성공' })
@ApiResponse({ status: 400, description: '검색어 누락' })
@ApiResponse({ status: 401, description: '인증 실패' })
async searchProfileMusicPreviews(
  @Query() query: SearchProfileMusicQueryDto,
): Promise<ApiSuccessResponse<{ items: ProfileMusicPreview[] }>> {
  const items = await this.usersService.searchProfileMusicPreviews(query.q);
  return createSuccessResponse('프로필 음악 검색 성공', { items });
}
```

> **라우트 순서 주의:** `@Get('profile-music/search')`는 `@Get(':userId/profiles')` 앞에 선언해야 NestJS가 정적 경로를 먼저 매칭한다.

---

## 9. UsersModule 변경

```typescript
import { DeezerTrackClient } from '../songs/deezer-track.client';

@Module({
  // ...
  providers: [
    UsersService,
    AccessTokenGuard,
    SelfUserGuard,
    DeezerTrackClient,  // 추가
    {
      provide: USERS_REPOSITORY,
      useClass: UsersPrismaRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
```

---

## 10. 기존 임시 API 제거 (songs 모듈)

`GET /songs/deezer/tracks/search` 엔드포인트를 songs.controller.ts에서 제거한다.

제거 범위:
- `songs.controller.ts`: `searchDeezerTrackPreviews` 핸들러 제거
- `songs.controller.ts`: `SearchDeezerTrackPreviewsQueryDto` import 제거 (사용하는 곳이 없어지면)
- `songs.service.ts`: `searchDeezerTrackPreviews` 메서드 제거 (미결 사항 참고)

---

## 11. 테스트 계획

### users.service.spec.ts 수정 사항

1. `mockProfile.profile.profileMusicUrl` 제거 → `profileMusic: null`로 교체

### searchProfileMusicPreviews 신규 테스트

| 케이스 | 검증 방법 |
|--------|-----------|
| happy path — 검색어 있음 | deezerTrackSearcher.searchTracks 호출 확인, ProfileMusicPreview[] 반환 |
| 검색어가 빈 문자열 | BadRequestException 발생 |
| 검색어가 공백만 있음 | BadRequestException 발생 |
| Deezer API 실패 | BadGatewayException 전파 확인 (DeezerTrackClient stub에서 throw) |
| 결과 없음 | 빈 배열 반환 |
| releaseDate 필드 미포함 | 반환 객체에 releaseDate 없음 확인 |

### updateUserProfile 테스트 케이스 보완

| 케이스 | 검증 방법 |
|--------|-----------|
| profileMusic 객체 전달 | profile 업데이트 시 9개 필드 매핑 확인 |
| profileMusic: null 전달 | 9개 필드 모두 null로 초기화 확인 |
| profileMusic: undefined (미전달) | 음악 필드 변경 없음 확인 |

### user.prisma-repository.spec.ts 수정

- `findUserProfileById` 반환 타입에서 `profileMusicUrl` 제거, `profileMusic` 객체 반환 확인

---

## 12. 미결 사항

| 번호 | 항목 | 현재 판단 | 확인 필요 여부 |
|------|------|-----------|---------------|
| 1 | `parseDeezerTrackToSongPreview` 및 `DeezerTrackClient`를 songs 모듈에서 직접 import — 모듈 경계 위반 여부 | songs 모듈에서 export하거나 공통 모듈로 분리하는 방법도 있음. 현재는 직접 import로 설계 | 팀 컨벤션 확인 권장 |
| 2 | `songs.service.ts`의 `searchDeezerTrackPreviews` 메서드 제거 여부 | GET /songs/deezer/tracks/search 엔드포인트 제거 시 songs.service 메서드도 제거 대상. 단, 다른 곳에서 사용 중이면 유지 | 사용처 확인 후 결정 |
| 3 | `ProfileMusicPreview` 타입을 `SongPreview`로 통일 가능 여부 | `releaseDate` 필드가 API 명세에 없어 별도 타입 정의. `SongPreview`에서 Omit으로 파생 가능하나 명시성 측면에서 별도 타입이 더 명확함 | 취향 차이, 현재 설계대로 진행 |
| 4 | `PATCH /users/:userId/profiles` 응답이 `{ updated: { profile, personalInfo, skills, favoriteGenres } }` — profileMusic 변경 여부도 별도 플래그로 노출할지 | 현재 API 명세는 profile 섹션 단위로만 플래그 반환. profileMusic은 profile 하위이므로 profile: true로 충분 | 현재 설계대로 진행 |
| 5 | `profileMusic: null` 전달 시 (음악 제거) 를 클라이언트가 명시적으로 null로 보내야 하는지 확인 필요 | class-validator에서 `@IsOptional()`과 `@ValidateNested()`를 조합할 때 null 허용 여부 설정 필요 | 구현 시 `@Allow()`나 `@IsOptional()` + `allowNull` 처리 확인 |
