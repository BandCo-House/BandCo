# 설계 문서: 곡(Song) 생성/수정 API 확장 — 커버 이미지 · 참고자료 파일 · 외부링크 · 곡 길이

> 대상 모듈: `src/modules/songs`
> 관련 API 명세: [docs/backend/api-docs/song.md](../docs/backend/api-docs/song.md) — `#24 곡 생성`, `#25 밴드 곡 목록 조회`, `#26 곡 수정`
> 사용자 확정 사항:
> - 외부 링크(다중): **배열 컬럼(`String[]`)**
> - 곡 길이(songLength): **초 단위 정수(Int)**
> - 참고자료 파일 / 외부링크의 PATCH 갱신 방식: **전체 교체 (`skillTypeIds`와 동일 패턴)**

---

## 1. 작업 범위

```
신규:
- prisma/schema.prisma  (Song 모델 필드 추가 + SongReferenceFile 모델 신규)
- src/modules/songs/dto/song-reference-file.dto.ts  (참고자료 파일 항목 DTO)
- src/modules/songs/types/song-reference-file.type.ts  (참고자료 파일 응답 타입)

수정:
- prisma/schema.prisma  (Song: songCoverUrl, songLength, externalLinks 필드 + referenceFiles 관계 추가)
- src/modules/songs/dto/create-song.dto.ts  (songCoverUrl, songLength, externalLinks, referenceFiles 추가)
- src/modules/songs/dto/update-song.dto.ts  (동일 필드 optional/nullable 추가)
- src/modules/songs/types/create-song-result.type.ts  (응답에 신규 필드 추가)
- src/modules/songs/types/update-song-result.type.ts  (응답에 신규 필드 추가)
- src/modules/songs/types/song-list.type.ts  (SongListItem에 신규 필드 추가)
- src/modules/songs/repositories/songs.repository.ts  (CreateSongRepositoryInput 확장)
- src/modules/songs/repositories/songs.prisma-repository.ts  (create/update/list 쿼리에 신규 필드 반영)
- src/modules/songs/songs.service.ts  (validateUpdateSongInput에 신규 필드 조건 추가)
- docs/backend/api-docs/song.md  (#24, #25, #26 명세에 신규 필드 반영)
```

파일 업로드(커버 이미지, 참고자료 파일)는 기존 `src/storage` 모듈의 `POST /storage/presigned-url` 흐름을 그대로 재사용한다. 프론트엔드가 먼저 presigned URL로 S3(NCP Object Storage)에 업로드한 뒤, 반환받은 `objectUrl`을 곡 생성/수정 요청 본문에 문자열로 전달하는 방식이다. **storage 모듈 자체는 수정하지 않는다.**

---

## 2. Prisma 스키마 변경

### 2.1 `Song` 모델 필드 추가

```prisma
model Song {
  id                    String              @id @default(uuid()) @db.Uuid
  bandId                String              @map("band_id") @db.Uuid
  title                 String              @db.VarChar(200)
  artistName            String              @map("artist_name") @db.VarChar(200)
  key                    SongKey?           @map("key")
  bpm                   Int?                @db.SmallInt
  sourceUrl             String?             @map("source_url")
  sourceType            String?             @map("source_type") @db.VarChar(20)
  memo                  String?
  difficultyLevel       Int?                @map("difficulty_level") @db.SmallInt
  songCoverUrl          String?             @map("song_cover_url") @db.VarChar(255)   // 신규
  songLength            Int?                @map("song_length") @db.SmallInt          // 신규 (초 단위)
  externalLinks         String[]            @map("external_links") @default([])       // 신규
  createdByBandMemberId String?             @map("created_by_band_member_id") @db.Uuid
  createdAt             DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)
  scheduleSongs         ScheduleSong[]
  songSkills            SongSkill[]
  referenceFiles        SongReferenceFile[]                                           // 신규
  band                  Band                @relation(fields: [bandId], references: [id], onDelete: Cascade)
  createdByBandMember   BandMember?         @relation("SongCreator", fields: [createdByBandMemberId], references: [id])
  teamSongs             TeamSong[]

  @@map("songs")
}
```

- `songCoverUrl`: `Team.teamCoverUrl`와 동일한 패턴(`String? @db.VarChar(255)`, 오브젝트 URL 저장).
- `songLength`: `bpm`/`difficultyLevel`과 동일하게 `SmallInt` 사용. 최대값 32767초(약 9.1시간)로 실사용 범위에 충분.
- `externalLinks`: Postgres native array. 마이그레이션 시 기존 row는 `@default([])`로 빈 배열 채움.

### 2.2 `SongReferenceFile` 모델 신규

```prisma
model SongReferenceFile {
  id        String   @id @default(uuid()) @db.Uuid
  songId    String   @map("song_id") @db.Uuid
  fileUrl   String   @map("file_url")
  fileName  String   @map("file_name") @db.VarChar(255)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  song      Song     @relation(fields: [songId], references: [id], onDelete: Cascade)

  @@map("song_reference_files")
}
```

- `fileUrl`: storage 모듈이 반환한 `objectUrl`.
- `fileName`: 업로드 시점의 원본 파일명(다운로드/표시용). presigned URL 발급 응답에는 없으므로 클라이언트가 별도로 전달해야 한다.
- `SongSkill`과 동일하게 `onDelete: Cascade` — 곡이 hard delete되면 참고자료 파일 row도 함께 삭제된다.
- soft delete 없음 (컨벤션 8: 특별한 이유 없이 `deletedAt` 추가 금지, 이 테이블은 곡과 생명주기를 공유하므로 불필요).

스키마 변경 후 `pnpm run prisma:generate` 및 `pnpm run prisma:migrate:dev` 필요.

---

## 3. Repository 인터페이스 변경

`songs.repository.ts`의 `CreateSongRepositoryInput`은 `CreateSongInput`(DTO)을 확장하므로, DTO에 필드가 추가되면 자동으로 포함된다. 인터페이스 시그니처 자체는 변경 없음 — `createSong`/`updateSong`의 내부 구현(prisma-repository)만 수정한다.

```typescript
// songs.repository.ts — 변경 없음, 참고용으로 명시
export interface CreateSongRepositoryInput extends CreateSongInput {
  bandId: string;
  userId: string;
  createdByBandMemberId: string;
  skillTypeIds: string[];
}
```

---

## 4. Service 비즈니스 규칙

`createSong`, `updateSong`의 기존 흐름(밴드 멤버십 검증 → skillType 검증 → repository 위임)은 변경하지 않는다. 신규 필드는 별도의 비즈니스 규칙 검증이 필요 없는 단순 전달 값이므로 Service 레이어에 로직을 추가하지 않는다 (DTO 레벨 검증으로 충분).

`validateUpdateSongInput`만 아래와 같이 조건을 확장한다:

```
validateUpdateSongInput(input):
1. 기존 조건(title/artistName/sourceUrl/sourceType/memo/skillTypeIds) 중 하나라도 존재하면 통과
2. songCoverUrl, songLength, externalLinks, referenceFiles 중 하나라도 존재하면 통과
3. 모두 없으면 BadRequestException("수정할 곡 정보가 필요합니다.")
```

---

## 5. API 번호 및 Swagger

기존 엔드포인트(`#24 곡 생성`, `#25 밴드 곡 목록 조회`, `#26 곡 수정`)의 요청/응답 필드만 확장한다. **신규 엔드포인트 없음 → 새 `#N` 번호 불필요.**

Swagger는 기존 `CreateSongBodyDto`/`UpdateSongBodyDto`의 `@ApiProperty`/`@ApiPropertyOptional`을 신규 필드에 추가하는 것으로 충분하며, Controller의 `@ApiOperation`/`@ApiResponse`는 변경하지 않는다.

---

## 6. DTO 및 타입 정의

### 6.1 `SongReferenceFileDto` (신규 파일: `dto/song-reference-file.dto.ts`)

`update-user-profile.dto.ts`의 `UpdateSkillDto` 중첩 배열 패턴을 따른다.

```typescript
export class SongReferenceFileDto {
  @ApiProperty({ description: '파일 URL (storage 업로드 후 objectUrl)', example: 'https://.../songs/uuid/reference.pdf' })
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  fileUrl!: string;

  @ApiProperty({ description: '원본 파일명 (최대 255자)', example: '악보_1절.pdf' })
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  fileName!: string;
}
```

### 6.2 `CreateSongBodyDto` 추가 필드

```typescript
@ApiPropertyOptional({ description: '곡 커버 이미지 URL', example: 'https://.../song-covers/uuid.jpg' })
@Transform(normalizeOptionalStringValue)
@IsOptional()
@IsString({ message: stringValidationMessage })
songCoverUrl?: string;

@ApiPropertyOptional({ description: '곡 길이 (초 단위)', example: 355 })
@IsOptional()
@IsInt({ message: intValidationMessage })
@Min(1, { message: minValidationMessage })
songLength?: number;

@ApiPropertyOptional({ description: '외부 링크 목록 (URL 배열)', type: [String] })
@IsOptional()
@IsArray()
@IsString({ each: true, message: stringValidationMessage })
externalLinks?: string[];

@ApiPropertyOptional({ description: '참고자료 파일 목록', type: [SongReferenceFileDto] })
@IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => SongReferenceFileDto)
referenceFiles?: SongReferenceFileDto[];
```

### 6.3 `UpdateSongBodyDto` 추가 필드

`sourceUrl`/`memo`와 동일하게 `null` 전달 시 값 삭제. `externalLinks`/`referenceFiles`는 `skillTypeIds`와 동일하게 **미전달 시 유지, 전달 시(빈 배열 포함) 전체 교체** — nullable 아님.

```typescript
@ApiPropertyOptional({ description: '곡 커버 이미지 URL (null로 설정 시 삭제)', nullable: true, example: 'https://.../song-covers/uuid.jpg' })
@Transform(normalizeOptionalStringValue)
@IsOptional()
@IsString({ message: stringValidationMessage })
songCoverUrl?: string | null;

@ApiPropertyOptional({ description: '곡 길이 (초 단위, null로 설정 시 삭제)', nullable: true, example: 355 })
@IsOptional()
@IsInt({ message: intValidationMessage })
@Min(1, { message: minValidationMessage })
songLength?: number | null;

@ApiPropertyOptional({ description: '외부 링크 목록 (전달 시 전체 교체, 빈 배열 전달 시 전체 삭제)', type: [String] })
@IsOptional()
@IsArray()
@IsString({ each: true, message: stringValidationMessage })
externalLinks?: string[];

@ApiPropertyOptional({ description: '참고자료 파일 목록 (전달 시 전체 교체, 빈 배열 전달 시 전체 삭제)', type: [SongReferenceFileDto] })
@IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => SongReferenceFileDto)
referenceFiles?: SongReferenceFileDto[];
```

> `normalizeOptionalStringValue`는 `typeof value !== 'string'`이면 원본을 그대로 반환하므로 `null`이 그대로 통과하고, `@IsOptional()`이 `null`을 검증 생략 대상으로 처리한다 (기존 `sourceUrl` 패턴과 동일).

### 6.4 응답 타입 (`types/`)

`create-song-result.type.ts`, `update-song-result.type.ts`, `song-list.type.ts`의 `song` 객체에 아래 필드 추가:

```typescript
songCoverUrl: string | null;
songLength: number | null;
externalLinks: string[];
referenceFiles: SongReferenceFileItem[];  // song-reference-file.type.ts (신규)
```

`song-reference-file.type.ts` (신규):

```typescript
export interface SongReferenceFileItem {
  id: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
}
```

---

## 7. Soft Delete 여부

- `Song`: soft delete 없음 (기존과 동일, hard delete).
- `SongReferenceFile`: soft delete 없음. `deletedAt` 미보유, 곡과 함께 cascade hard delete.

---

## 8. 트랜잭션 경계

| 메서드                  | tx 필요 여부 | 이유                                                                 |
| ----------------------- | :----------: | -------------------------------------------------------------------- |
| createSong (repository) |     필요     | song insert + songSkill insert + songReferenceFile insert를 원자적으로 처리 (기존과 동일하게 Service의 `$transaction` 경계를 그대로 사용) |
| updateSong (repository) |     필요     | songSkill 전체 교체 + songReferenceFile 전체 교체 + song update를 원자적으로 처리 |

Service의 `createSong`/`updateSong`이 이미 `tx?` 인자를 받아 `$transaction`으로 감싸고 있으므로, 신규 로직은 그 안에서 실행되는 repository 메서드에 편입될 뿐 트랜잭션 경계 자체는 변경되지 않는다.

---

## 9. 테스트 계획

`songs.service.spec.ts` (Repository Stub 기반):

| 메서드         | 케이스                                                        | 검증 방법                                          |
| -------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| createSong     | songCoverUrl/songLength/externalLinks/referenceFiles 포함 생성 | 반환된 song 객체에 필드가 그대로 반영되는지 확인    |
| createSong     | 신규 필드 없이 생성 (기존 계약 유지)                            | 기존 happy path 그대로 통과 확인 (회귀 없음)         |
| updateSong     | referenceFiles를 빈 배열로 전달 → 기존 파일 전체 삭제           | repository stub에 전달된 delete 호출 인자 검증       |
| updateSong     | externalLinks만 전달 → 다른 필드는 유지                         | 업데이트 데이터에 externalLinks만 포함되는지 확인    |
| updateSong     | 모든 신규 필드 미전달 + 기존 필드도 미전달                       | BadRequestException("수정할 곡 정보가 필요합니다.") |
| updateSong     | songCoverUrl/songLength를 null로 전달 → 삭제                    | update data에 null이 전달되는지 확인                 |
| updateSong     | tx 일관성                                                       | capturedTransactions 검증 (기존 패턴)                |
| updateSong     | 외부 tx 전달                                                    | createPrismaServiceFailingTransactionStub 사용       |

`songs.prisma-repository.spec.ts`:

| 메서드     | 케이스                                             | 검증 방법                                                |
| ---------- | --------------------------------------------------- | ----------------------------------------------------------- |
| createSong | referenceFiles 포함 시 songReferenceFile.createMany 호출 확인 | prisma mock 호출 인자 검증                                  |
| updateSong | referenceFiles 전달 시 deleteMany 후 createMany 호출 확인      | 호출 순서/인자 검증 (기존 skillTypeIds 테스트와 동일 구조) |
| updateSong | externalLinks 전달 시 `{ set: [...] }`로 update 호출 확인       | prisma mock 호출 인자 검증                                  |

---

## 10. 미결 사항

1. **목록 조회(#25) 응답에 `referenceFiles`/`externalLinks`를 전체 포함할지 여부.**
   현재 단일 곡 상세 조회(GET) 엔드포인트가 없어, 생성/수정 응답 이외에 참고자료 파일에 접근할 방법이 목록 조회뿐이다. 기존 `skills`가 목록에 전체 임베딩되는 패턴을 따라 이번 설계도 `referenceFiles`/`externalLinks`를 목록 아이템에 전체 포함하는 것으로 가정했다. 곡당 참고자료 파일 수가 많아질 경우 목록 조회 payload가 커질 수 있으니, 필요하면 목록에는 개수(`referenceFileCount`)만 노출하고 상세는 별도 `GET /songs/:songId` 엔드포인트를 새로 설계하는 방안도 가능하다. **→ 확인 필요.**
2. **참고자료 파일/외부링크 개수 제한.** 곡 하나당 업로드 가능한 파일 수, 링크 수에 상한이 필요한지 명시되지 않아 이번 설계에는 제한을 두지 않았다. 필요 시 Service 레벨에서 `BadRequestException`으로 제한 추가 가능.
3. **참고자료 파일의 MIME 타입/용량 제한.** storage 모듈의 presigned URL 발급 단계에서 별도 제약이 없다면, 곡 참고자료 업로드에도 별도 제약을 걸지 않는 것으로 가정했다. 프론트엔드/스토리지 정책상 필요하면 별도 논의 필요.
4. **`songCoverUrl` 업로드 폴더명.** `POST /storage/presigned-url`의 `folder` 파라미터에 어떤 값을 쓸지는 프론트엔드/클라이언트 재량으로 가정(예: `song-covers`, `song-references`). 백엔드 스키마/검증에는 영향 없음.
