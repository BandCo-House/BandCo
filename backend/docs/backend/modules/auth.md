# Auth 모듈

경로: `jamplay/backend/src/auth/`

---

## 파일 목록

```
auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.service.spec.ts
├── dto/
│   ├── register-email.dto.ts
│   └── check-email.dto.ts
├── guard/
│   ├── basic-token.guard.ts
│   ├── basic-token.guard.spec.ts
│   ├── bearer-token.guard.ts
│   └── bearer-token.guard.spec.ts
└── types/
    └── auth.types.ts
```

---

## 아키텍처

Auth는 다른 모듈과 달리 Repository 패턴을 직접 사용하지 않는다.
`AuthService`가 `UsersService`에 의존하고, `UsersService`가 내부적으로 `UsersRepository`를 사용한다.

```
AuthController → AuthService → UsersService → UsersRepository
```

JWT: access token(5분) + refresh token(1시간). 두 토큰 모두 JWT이며 payload의 `type` 필드로 구분.

---

## AuthService 메서드

```typescript
extractTokenFromHeader(header: string, isBearer: boolean): string
decodeBasicToken(base64String: string): { email: string; password: string }
verifyToken(token: string): { email: string; sub: string; type: 'access' | 'refresh' }
rotateToken(token: string, isRefreshToken: boolean): string
registerWithEmail(user: { email: string; password: string }): Promise<{ accessToken: string; refreshToken: string }>
loginWithEmail(user: { email: string; password: string }): Promise<{ accessToken: string; refreshToken: string }>
loginUser(user: Pick<User, 'email' | 'id'>): { accessToken: string; refreshToken: string }
signToken(user: Pick<User, 'email' | 'id'>, isRefreshToken: boolean): string
```

---

## 비즈니스 규칙

### extractTokenFromHeader
- `Authorization: Bearer <token>` 또는 `Authorization: Basic <token>` 형식
- prefix 불일치 → `UnauthorizedException`
- 공백 분리 2조각이 아님 → `UnauthorizedException`

### decodeBasicToken
- Base64 디코딩 후 `:` 기준 split
- `email:password` 형식이 아님 → `UnauthorizedException`

### registerWithEmail
- 이미 존재하는 이메일 → `BadRequestException` (UsersService에서 처리)
- 비밀번호는 bcrypt 해시 후 저장

### loginWithEmail
- 이메일 없음 → `UnauthorizedException`
- 비밀번호 불일치 → `UnauthorizedException`

### Guards
- `BasicTokenGuard` — `/auth/login/email` 전용, Basic 토큰을 추출해 `req.user` 세팅
- `BearerTokenGuard` — 나머지 보호된 라우트, access/refresh 모두 처리

---

## 테스트 패턴 (예외: NestJS TestingModule 사용)

Auth는 `JwtService`(외부 의존성)와 `bcrypt`가 얽혀 있어 stub 대신 Jest mock 사용.

```typescript
const mockJwtService = { sign: jest.fn(), verify: jest.fn() };
const mockUsersService = {
  getUserByEmail: jest.fn(),
  createUserWithEmail: jest.fn(),
};

beforeEach(async () => {
  const module = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: JwtService, useValue: mockJwtService },
      { provide: UsersService, useValue: mockUsersService },
    ],
  }).compile();

  service = module.get<AuthService>(AuthService);
  jest.clearAllMocks();
});
```

Guard 테스트도 같은 방식으로 `ExecutionContext` mock을 만들어 사용한다.
