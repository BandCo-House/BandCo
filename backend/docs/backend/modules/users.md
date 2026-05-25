# Users 모듈

경로: `jamplay/backend/src/modules/users/`

---

## 파일 목록

```
users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── users.service.spec.ts
├── dto/
│   ├── get-users-query.dto.ts
│   └── update-user-profile.dto.ts
├── guard/
│   ├── self-user.guard.ts
│   └── self-user.guard.spec.ts
├── repositoreis/               ← 오타 주의 (repositories 아님)
│   ├── user.repository.ts
│   ├── user.prisma-repository.ts
│   └── user.prisma-repository.spec.ts
├── types/
│   ├── user-list.type.ts
│   └── user-profile.type.ts
└── util/
    └── nickname_maker.ts
```

---

## Repository 인터페이스

```typescript
export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UsersRepository {
  findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<User | null>;
  createUserWithEmail(email: string, passwordHash: string, tx?: Prisma.TransactionClient): Promise<User>;
  findUsers(query: GetUsersQuery, tx?: Prisma.TransactionClient): Promise<GetUsersResult>;
  findUserProfileById(userId: string, tx?: Prisma.TransactionClient): Promise<GetUserProfileResult | null>;
  updateUserProfile(userId: string, data: UpdateUserProfileData, tx?: Prisma.TransactionClient): Promise<GetUserProfileResult>;
}
```

---

## 비즈니스 규칙 (Service)

### getUserByEmail
- AuthService에서 호출되는 메서드
- 이메일 없음 → `NotFoundException`

### createUserWithEmail
- 이미 존재하는 이메일 → `BadRequestException`
- 비밀번호 bcrypt 해시는 AuthService에서 처리 후 전달

### updateUserProfile
- 본인만 수정 가능 (`SelfUserGuard`가 컨트롤러에서 처리)
- 수정 필드 없음 → `BadRequestException`

### SelfUserGuard
- `:userId` 파라미터와 JWT payload의 `sub`(userId) 비교
- 불일치 → `ForbiddenException`

---

## DB 모델 (관련 부분)

```prisma
model User {
  id           String      @id @default(uuid())
  email        String?     @unique
  passwordHash String?     @map("password_hash")
  status       UserStatus  @default(ACTIVE)
  deletedAt    DateTime?   @map("deleted_at")
  profile      UserProfile?
  userSkills   UserSkill[]
  favoriteGenres FavoriteGenre[]
}

model UserProfile {
  userId          String    @id @map("user_id")
  nickname        String    @db.VarChar(255)
  selfDescription String?
  profileMusicUrl String?
  avatarUrl       String?
}

enum UserStatus { ACTIVE  INACTIVE }
```

---

## 테스트 Stub 스켈레톤

```typescript
function createUsersRepositoryStub(options?: {
  user?: User | null;
  userProfile?: GetUserProfileResult | null;
  onCreateUserWithEmail?: (email: string, passwordHash: string, tx: unknown) => void;
  onFindByEmail?: (tx: unknown) => void;
  onUpdateUserProfile?: (userId: string, data: UpdateUserProfileData, tx: unknown) => void;
}): UsersRepository {
  return {
    async findByEmail(_email, tx) {
      options?.onFindByEmail?.(tx);
      return options?.user !== undefined ? options.user : DEFAULT_USER;
    },
    async createUserWithEmail(email, passwordHash, tx) {
      options?.onCreateUserWithEmail?.(email, passwordHash, tx);
      return DEFAULT_USER;
    },
    async findUsers(_query, _tx) {
      return { items: [], meta: { count: 0, take: 20, cursor: null, next: null } };
    },
    async findUserProfileById(_userId, _tx) {
      return options?.userProfile !== undefined ? options.userProfile : DEFAULT_PROFILE;
    },
    async updateUserProfile(userId, data, tx) {
      options?.onUpdateUserProfile?.(userId, data, tx);
      return DEFAULT_PROFILE;
    },
  };
}
```
