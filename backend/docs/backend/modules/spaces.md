# Spaces 모듈

경로: `jamplay/backend/src/modules/spaces/`

---

## 파일 목록

```
spaces/
├── spaces.module.ts
├── spaces.controller.ts
├── spaces.service.ts
├── spaces.service.spec.ts
├── dto/
│   ├── create-band-space.dto.ts
│   ├── get-band-spaces-query.dto.ts
│   └── add-space-member.dto.ts
├── repositories/
│   ├── spaces.repository.ts
│   └── spaces.prisma-repository.ts
└── types/
    ├── create-band-space-result.type.ts
    ├── band-space-list-item.type.ts
    ├── space-detail.type.ts
    └── add-space-member-result.type.ts
```

---

## DB 모델 (관련 부분)

```prisma
model BandSpace {
  id                    String          @id @default(uuid())
  bandId                String
  name                  String          @db.VarChar(150)
  description           String?
  spaceType             BandSpaceType?
  status                BandSpaceStatus @default(ACTIVE)
  startDate             DateTime?
  endDate               DateTime?
  createdByBandMemberId String
  deletedAt             DateTime?
  members               SpaceMember[]
  bandSpaceTeams        BandSpaceTeam[]
  schedules             Schedule[]
}

model SpaceMember {
  id           String                @id @default(uuid())
  bandSpaceId  String
  bandMemberId String
  role         BandSpaceMemberRole   @default(MEMBER)
  status       BandSpaceMemberStatus @default(ACTIVE)
  joinedAt     DateTime              @default(now())
}

enum BandSpaceType   { PERFORMANCE  PRACTICE  ONLINE }
enum BandSpaceStatus { ACTIVE  INACTIVE }
enum BandSpaceMemberRole   { LEADER  MEMBER }
enum BandSpaceMemberStatus { ACTIVE  INACTIVE }
```

---

## 비즈니스 규칙 메모

- 스페이스 생성 시 요청자가 해당 밴드의 멤버여야 한다
- 멤버 추가 시 이미 스페이스에 있는 멤버면 `BadRequestException`
- soft-delete: `deletedAt` 필드 기준
- 스페이스 조회 시 `status: ACTIVE` + `deletedAt: null` 조건

---

## 테스트 Stub 스켈레톤

```typescript
function createSpacesRepositoryStub(options?: {
  activeBandSpace?: { id: string; bandId: string } | null;
  onCreateBandSpace?: (input: unknown, tx: unknown) => void;
  onAddSpaceMember?: (input: unknown, tx: unknown) => void;
}): SpacesRepository {
  return {
    async createBandSpace(input, tx) {
      options?.onCreateBandSpace?.(input, tx);
      return DEFAULT_SPACE_RESULT;
    },
    async findBandSpaces(_query, _tx) {
      return { items: [], meta: { count: 0, take: 20, cursor: null, next: null } };
    },
    async findSpaceById(_id, _tx) {
      return options?.activeBandSpace !== undefined ? options.activeBandSpace : DEFAULT_SPACE;
    },
    async addSpaceMember(input, tx) {
      options?.onAddSpaceMember?.(input, tx);
      return DEFAULT_ADD_MEMBER_RESULT;
    },
  };
}
```

완전한 stub은 `jamplay/backend/src/modules/spaces/spaces.service.spec.ts` 참고.
