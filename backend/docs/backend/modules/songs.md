# Songs 모듈

경로: `jamplay/backend/src/modules/songs/`

---

## 파일 목록

```
songs/
├── songs.module.ts
├── songs.controller.ts
├── songs.service.ts
├── songs.service.spec.ts
├── deezer-track.client.ts      # Deezer API HTTP 클라이언트
├── deezer-track.parser.ts      # Deezer API 응답 파싱
├── spotify-track.client.ts     # Spotify API HTTP 클라이언트
├── spotify-track.parser.ts     # Spotify API 응답 파싱
├── dto/
│   ├── create-song.dto.ts
│   ├── update-song.dto.ts
│   ├── get-band-songs-query.dto.ts
│   └── search-deezer-track-previews-query.dto.ts
├── repositories/
│   ├── songs.repository.ts
│   └── songs.prisma-repository.ts
│   └── songs.prisma-repository.spec.ts
└── types/
    ├── create-song-result.type.ts
    ├── delete-song-result.type.ts
    ├── update-song-result.type.ts
    ├── song-list.type.ts
    ├── song-access-context.type.ts
    ├── song-preview.type.ts
    ├── deezer-track-api-response.type.ts
    ├── spotify-track-api-response.type.ts
    └── spotify-client-credentials-token-response.type.ts
```

---

## 외부 API 연동

- **Deezer**: 곡 검색 및 미리듣기 URL 제공 (인증 불필요)
- **Spotify**: 추가 메타데이터 제공 (Client Credentials 토큰 필요)
  - 환경변수: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` (`backend/.env.example` 참고)

---

## DB 모델 (관련 부분)

```prisma
model Song {
  id                    String    @id @default(uuid())
  bandId                String
  title                 String    @db.VarChar(200)
  artistName            String    @map("artist_name") @db.VarChar(200)
  key                   SongKey?
  bpm                   Int?      @db.SmallInt
  sourceUrl             String?   @map("source_url")
  sourceType            String?   @map("source_type") @db.VarChar(20)
  memo                  String?
  difficultyLevel       Int?      @map("difficulty_level") @db.SmallInt
  createdByBandMemberId String?
  songSkills            SongSkill[]
  scheduleSongs         ScheduleSong[]
  teamSongs             TeamSong[]
}

model SongSkill {
  id          String @id @default(uuid())
  songId      String
  skillTypeId String
}

enum SongKey { C  CM  D  DM  E  EM  F  FM  G  GM  A  AM  B  BM }
```

---

## 비즈니스 규칙 메모

- 곡 생성/수정/삭제: 요청자가 해당 밴드 멤버여야 한다 (`song-access-context.type.ts` 참고)
- `songSkills` 수정 시 기존 스킬 전체 삭제 후 재삽입 (replace 방식)
- Deezer 검색 결과는 DB에 저장하지 않음 (검색 전용)
- `bpm`은 0 이상 정수 (`@db.SmallInt`)
- `difficultyLevel`은 정수 범위 검증 필요

---

## 테스트 Stub 스켈레톤

```typescript
function createSongsRepositoryStub(options?: {
  activeBandWithMember?: {
    id: string;
    members: Array<{ id: string; userId: string }>;
  } | null;
  song?: { id: string; bandId: string } | null;
  onCreateSong?: (input: unknown, tx: unknown) => void;
  onUpdateSong?: (songId: string, input: unknown, tx: unknown) => void;
  onDeleteSong?: (songId: string, tx: unknown) => void;
}): SongsRepository {
  return {
    async findActiveBandWithMemberByBandIdAndUserId(_bandId, _userId, _tx) {
      return options?.activeBandWithMember !== undefined
        ? options.activeBandWithMember
        : DEFAULT_BAND_WITH_MEMBER;
    },
    async createSong(input, tx) {
      options?.onCreateSong?.(input, tx);
      return DEFAULT_CREATE_RESULT;
    },
    // ... 나머지
  };
}
```

완전한 stub은 `jamplay/backend/src/modules/songs/songs.service.spec.ts` 참고.
