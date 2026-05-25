# Bands 모듈

경로: `jamplay/backend/src/modules/bands/`

---

## 파일 목록

```
bands/
├── bands.module.ts
├── bands.controller.ts
├── bands.service.ts
├── bands.service.spec.ts
├── dto/
│   ├── create-band.dto.ts
│   ├── update-band.dto.ts
│   ├── get-my-bands-query.dto.ts
│   ├── get-band-members-query.dto.ts
│   ├── search-bands-query.dto.ts
│   └── update-band-member-role.dto.ts
├── repositories/
│   ├── bands.repository.ts
│   └── bands.prisma-repository.ts
└── types/
    ├── create-band-result.type.ts
    ├── delete-band-result.type.ts
    ├── leave-band-result.type.ts
    ├── my-band-list.type.ts
    ├── band-member-list.type.ts
    ├── band-search-result.type.ts
    ├── update-band-result.type.ts
    └── update-band-member-role-result.type.ts
```

---

## Repository 인터페이스

```typescript
export const BANDS_REPOSITORY = Symbol('BANDS_REPOSITORY');

export interface BandsRepository {
  createBand(input: CreateBandRepositoryInput, tx?: Prisma.TransactionClient): Promise<CreateBandRepositoryResult>;
  deleteBand(bandId: string, deletedAt: Date, tx?: Prisma.TransactionClient): Promise<DeleteBandResult>;
  findActiveBandById(bandId: string, tx?: Prisma.TransactionClient): Promise<{ id: string; bandMasterUserId: string } | null>;
  findBandForLeave(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<{ id: string; member: { id: string; role: BandMemberRole } | null } | null>;
  leaveBand(bandMemberId: string, tx?: Prisma.TransactionClient): Promise<LeaveBandResult>;
  findBandMembers(bandId: string, query: GetBandMembersQuery, tx?: Prisma.TransactionClient): Promise<GetBandMembersResult>;
  findMyBands(userId: string, query: GetMyBandsQuery, tx?: Prisma.TransactionClient): Promise<GetMyBandsResult>;
  searchBands(query: SearchBandsQuery, tx?: Prisma.TransactionClient): Promise<SearchBandsResult>;
  updateBand(bandId: string, input: UpdateBandInput, tx?: Prisma.TransactionClient): Promise<UpdateBandResult>;
  findBandMemberByBandIdAndUserId(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<{ id: string; userId: string } | null>;
  findExistingGenreIds(genreIds: string[], tx?: Prisma.TransactionClient): Promise<string[]>;
  findExistingUserIds(userIds: string[], tx?: Prisma.TransactionClient): Promise<string[]>;
  updateBandMemberRole(bandMemberId: string, input: UpdateBandMemberRoleInput, tx?: Prisma.TransactionClient): Promise<UpdateBandMemberRoleResult>;
}
```

---

## 비즈니스 규칙 (Service)

### createBand
- 중복 genreIds → `BadRequestException`
- 중복 inviteeUserIds → `BadRequestException`
- 존재하지 않는 genreId 포함 → `BadRequestException`
- 초대 대상 필터링: bandMaster 본인 제외, 존재하지 않는 userId 제외 → 실패 목록으로 분리 (예외 아님)
- genreId 검증 + 초대 검증 + createBand → 같은 tx

### deleteBand
- 밴드 없음(soft-delete 포함) → `NotFoundException`
- 요청자가 bandMasterUserId가 아님 → `ForbiddenException`
- deletedAt = new Date()로 soft-delete

### leaveBand
- 밴드 없음 또는 멤버 아님 → `NotFoundException` / `ForbiddenException`
- 밴드장(role === BM)은 이 API 사용 불가 → `ForbiddenException`

### getBandMembers
- 밴드 없음 → `NotFoundException`
- order__joined_at과 order__id 방향 불일치 → `BadRequestException`
- 커서 페어(joined_at + id)는 둘 다 있거나 둘 다 없어야 함 → `BadRequestException`

### getMyBands
- 커서 페어(created_at + id) 쌍 검증 → `BadRequestException`
- 날짜 파싱 실패 → `BadRequestException`

### searchBands
- order 방향 불일치 → `BadRequestException`
- 커서 페어 검증 → `BadRequestException`

### updateBand
- 수정 필드 하나도 없음 → `BadRequestException`
- name 빈 문자열 → `BadRequestException`
- 밴드 없음 → `NotFoundException`
- 요청자가 BM 아님 → `ForbiddenException`

### updateBandMemberRole
- 대상 역할이 BM → `BadRequestException` (BM 권한 부여 불가)
- 요청자 자신의 역할 변경 시도 → `BadRequestException`
- 밴드 없음 → `NotFoundException`
- 요청자가 BM 아님 → `ForbiddenException`
- 대상 멤버가 밴드에 없음 → `NotFoundException`

---

## DB 모델 (관련 부분)

```prisma
model Band {
  id               String     @id @default(uuid())
  name             String     @db.VarChar(40)
  bandMasterUserId String     @map("bm_id")
  description      String?
  visibility       Boolean    @default(true)
  coverImgUrl      String?    @map("cover_img_url")
  deletedAt        DateTime?  @map("deleted_at")
  members          BandMember[]
  bandGenres       BandGenre[]
  invitations      BandInvitation[]
}

model BandMember {
  id       String         @id @default(uuid())
  bandId   String
  userId   String
  role     BandMemberRole @default(MEMBER)
  joinedAt DateTime       @default(now())
}

enum BandMemberRole { BM  ADMIN  MEMBER }
```

---

## 테스트 Stub 스켈레톤

```typescript
// bands.service.spec.ts 기준 패턴
function createBandsRepositoryStub(options?: {
  existingGenreIds?: string[];
  existingUserIds?: string[];
  activeBand?: { id: string; bandMasterUserId: string } | null;
  bandForLeave?: { id: string; member: { id: string; role: BandMemberRole } | null } | null;
  bandMemberForRoleUpdate?: { id: string; userId: string } | null;
  onCreateBand?: (input: CreateBandRepositoryInput, tx: unknown) => void;
  onDeleteBand?: (bandId: string, deletedAt: Date, tx: unknown) => void;
  onFindActiveBandById?: (tx: unknown) => void;
  // ... 나머지 콜백
}): BandsRepository { /* ... */ }
```

완전한 stub 구현은 `jamplay/backend/src/modules/bands/bands.service.spec.ts` 참고.
