# Skills 모듈

경로: `jamplay/backend/src/modules/skills/`

---

## 파일 목록

```
skills/
├── skills.module.ts
├── skills.service.ts
├── skills.service.spec.ts
├── repositories/
│   ├── skills.repository.ts
│   ├── skills.prisma-repository.ts
│   └── skills.prisma-repository.spec.ts
└── types/
    └── existing-skill-type-ids-result.type.ts
```

컨트롤러 없음 — Skills는 다른 모듈(users, songs)이 내부적으로 참조하는 인프라 모듈.

---

## DB 모델

```prisma
model SkillType {
  id         String      @id @default(uuid())
  name       String      @db.VarChar(40)
  userSkills UserSkill[]
  songSkills SongSkill[]
}

model UserSkill {
  id          String         @id @default(uuid())
  skillLevel  SkillLevelType @default(BEGINNER)
  isPrimary   Boolean        @default(false)
  skillTypeId String
  userId      String
  @@unique([userId, skillTypeId])
}

enum SkillLevelType { BEGINNER  INTERMEDIATE  ADVANCED }
```

---

## Repository 인터페이스

```typescript
export const SKILLS_REPOSITORY = Symbol('SKILLS_REPOSITORY');

export interface SkillsRepository {
  findExistingSkillTypeIds(skillTypeIds: string[], tx?: Prisma.TransactionClient): Promise<ExistingSkillTypeIdsResult>;
}
```

---

## 비즈니스 규칙 메모

- `findExistingSkillTypeIds`: 요청한 ID 중 실제 DB에 존재하는 것만 반환
- Users 모듈에서 프로필 업데이트 시 스킬 ID 검증에 사용
- Songs 모듈에서 곡 스킬 설정 시 스킬 ID 검증에 사용

---

## 테스트 Stub 스켈레톤

```typescript
function createSkillsRepositoryStub(options?: {
  existingSkillTypeIds?: string[];
}): SkillsRepository {
  return {
    async findExistingSkillTypeIds(skillTypeIds, _tx) {
      const existing = options?.existingSkillTypeIds ?? skillTypeIds;
      return { existingIds: existing };
    },
  };
}
```

완전한 stub은 `jamplay/backend/src/modules/skills/skills.service.spec.ts` 참고.
