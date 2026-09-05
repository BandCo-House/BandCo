# Google OAuth 로그인 설계

> 작성일: 2026-09-01 · 대상 모듈: `src/auth`, `src/modules/users` · API 명세: `docs/backend/api-docs/users.md`

## 0. 인증 흐름 결정: ID 토큰 검증 방식 채택

두 방식을 비교한 결과 **ID 토큰 검증 방식(B)** 을 채택한다.

### A. 리다이렉트(Authorization Code) 방식

1. 프론트가 백엔드 `/auth/login/google`로 이동 → 백엔드가 Google 동의 화면으로 리다이렉트
2. Google이 백엔드 콜백(`/auth/callback/google`)으로 인가 코드 전달
3. 백엔드가 코드 + client_secret으로 Google 토큰 교환 → 유저 정보 조회 → 자체 JWT 발급
4. SPA로 토큰 전달(쿼리스트링 또는 쿠키)

- 장점: client_secret이 서버에만 존재, Google 리프레시 토큰 확보 가능(Google API를 계속 호출할 때 필요)
- 단점: 엔드포인트 2개 + state(CSRF) 관리, 환경별 리다이렉트 URI 등록·관리, SPA로의 토큰 전달이 어색함(쿼리 노출 or 쿠키 전환), 테스트 어려움

### B. ID 토큰 검증 방식 (채택)

1. 프론트가 Google Identity Services(GIS) SDK로 로그인 → **ID 토큰**(Google이 서명한 JWT) 획득
2. 프론트가 `POST /auth/login/google`에 ID 토큰 전송
3. 백엔드가 Google 공개키로 서명·audience(`GOOGLE_CLIENT_ID`)·만료 검증 → `sub`(Google 고유 ID)·email 추출
4. 계정 조회/연결/생성 후 자체 JWT 쌍 발급 (기존 이메일 로그인과 동일한 응답)

- 장점: 엔드포인트 1개, client_secret 불필요(`GOOGLE_CLIENT_ID`만 필요), 리다이렉트 URI 관리 불필요, passport 없이 가드 직접 구현하는 기존 스타일과 일치, 검증기 스텁으로 테스트 용이
- 단점: 프론트에 GIS SDK 연동 필요, Google 리프레시 토큰을 받지 못함 — **로그인(신원 확인)만 필요하므로 문제 없음**

채택 근거: 이 프로젝트는 Google API를 지속 호출하지 않고 신원 확인만 필요하며, 프론트가 React SPA이므로 B가 구조적으로 단순하다.

## 1. 작업 범위

```
신규:
- src/auth/dto/login-google.dto.ts
- src/auth/google-auth.client.ts          (ID 토큰 검증 클라이언트)
- src/auth/google-auth.client.spec.ts
- prisma/migrations/…_add_user_oauth_accounts/  (스키마 변경)

수정:
- prisma/schema.prisma                     (UserOAuthAccount 모델 + OAuthProvider enum + User relation)
- src/auth/auth.controller.ts              (POST /auth/login/google 추가)
- src/auth/auth.service.ts                 (loginWithGoogle 추가)
- src/auth/auth.service.spec.ts
- src/auth/auth.module.ts                  (GoogleAuthClient provider 등록)
- src/modules/users/repositoreis/user.repository.ts        (OAuth 메서드 3개 추가)
- src/modules/users/repositoreis/user.prisma-repository.ts (구현)
- src/modules/users/repositoreis/user.prisma-repository.spec.ts
- src/modules/users/users.service.ts       (OAuth 관련 메서드 추가)
- src/modules/users/users.service.spec.ts
- docs/backend/api-docs/users.md           (#70 추가 — 완료)
- backend/package.json                     (google-auth-library 의존성 추가)
```

## 2. DB 스키마 변경

```prisma
enum OAuthProvider {
  GOOGLE
}

model UserOAuthAccount {
  id             String        @id @default(uuid()) @db.Uuid
  userId         String        @map("user_id") @db.Uuid
  provider       OAuthProvider
  providerUserId String        @map("provider_user_id") @db.VarChar(255)
  email          String?       @db.VarChar(255)
  createdAt      DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime      @updatedAt @map("updated_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id])

  @@unique([provider, providerUserId])
  @@map("user_oauth_accounts")
}
```

- `User`에 `oauthAccounts UserOAuthAccount[]` relation 추가.
- `deletedAt` 없음 — 컨벤션 Section 8(soft delete 기본 금지). 탈퇴는 User.deletedAt으로 판별.
- `@@unique([provider, providerUserId])` — 같은 Google 계정이 두 유저에 연결되는 것을 DB 레벨에서 차단.
- 확장성: provider enum에 KAKAO 등 추가만 하면 재사용 가능.

## 3. Repository 인터페이스 변경 (`user.repository.ts`)

```typescript
/** OAuth 계정으로 연결된 유저를 조회한다. 탈퇴 유저는 제외한다. */
findUserByOAuth(
  provider: OAuthProvider,
  providerUserId: string,
  tx?: Prisma.TransactionClient,
): Promise<AuthUser | null>;

/** OAuth 유저와 프로필, OAuth 계정 연결을 함께 생성한다. */
createUserWithOAuth(
  input: CreateOAuthUserInput,   // { provider, providerUserId, email, nickname }
  tx?: Prisma.TransactionClient,
): Promise<User>;

/** 기존 유저에 OAuth 계정을 연결한다. */
createOAuthAccount(
  userId: string,
  provider: OAuthProvider,
  providerUserId: string,
  email: string,
  tx?: Prisma.TransactionClient,
): Promise<void>;

/** OAuth 연결 판단용으로 이메일 유저를 탈퇴 여부 포함 조회한다. */
findUserForOAuthLink(
  email: string,
  tx?: Prisma.TransactionClient,
): Promise<OAuthLinkUser | null>;   // AuthUser & { deletedAt: Date | null }
```

`CreateOAuthUserInput` 타입은 `src/modules/users/types/oauth-user.type.ts`에 정의한다.

## 4. Service 비즈니스 규칙

### GoogleAuthClient.verifyIdToken(idToken)

`google-auth-library`의 `OAuth2Client.verifyIdToken`을 감싼다 (DeezerTrackClient 패턴).

```
1. audience = GOOGLE_CLIENT_ID로 서명·만료·audience 검증
2. 실패 → UnauthorizedException('유효하지 않은 Google 토큰입니다.')
3. payload에서 { sub, email, emailVerified, name } 추출해 반환
```

- 생성자에서 `configService.getOrThrow('GOOGLE_CLIENT_ID')` — AuthService의 JWT_SECRET 처리와 동일 패턴.

### AuthService.loginWithGoogle(idToken)

```
1. GoogleAuthClient.verifyIdToken → GoogleUserPayload
2. emailVerified가 false → UnauthorizedException('이메일 인증이 완료되지 않은 Google 계정입니다.')
   (미인증 이메일로 기존 계정에 자동 연결하면 계정 탈취가 가능하므로 차단)
3. $transaction 안에서:
   a. usersService.getUserByOAuth(GOOGLE, sub) → 있으면 해당 유저로 로그인 (기존 연결)
   b. 없으면 usersService.getUserForOAuthLink(email) — 탈퇴 유저 포함 조회 →
      - 활성 유저: usersService.linkOAuthAccount(userId, GOOGLE, sub, email) 후 로그인
        (요구사항: 동일 이메일이면 기존 계정에 자동 연결)
      - 탈퇴 유저(deletedAt 존재): UnauthorizedException('탈퇴한 계정입니다.')  ← 결정 (b)
      - 없음: usersService.createUserWithGoogle({ provider, sub, email, nickname }) 후 로그인
        (nickname = Google 프로필 name, 없으면 email의 @ 앞부분)
4. loginUser(email, id)로 accessToken/refreshToken 쌍 반환 — 이메일 로그인과 동일 응답 형태
```

- `findUserByOAuth`는 기존 구현과 동일하게 `deletedAt: null` 조건 포함. b단계만 탈퇴 유저를 **포함해** 조회해야 탈퇴 계정을 구분할 수 있다 — 이것이 `findUserForOAuthLink`가 별도로 필요한 이유.
- P2002(동시 요청으로 인한 유니크 위반)는 `createUserWithEmail`과 동일하게 BadRequestException으로 변환.

## 5. API 번호 및 Swagger

**#70 POST /auth/login/google — 신규** (users.md 기존 최대 #69 기준, api-docs에 추가 완료)

```typescript
@Post('login/google')
@ApiOperation({ summary: 'Google 로그인' })
@ApiResponse({ status: 201, description: '로그인 성공 (신규 가입·기존 연결 모두 동일 응답)' })
@ApiResponse({ status: 400, description: '유효성 검사 실패 (idToken 누락)' })
@ApiResponse({ status: 401, description: '유효하지 않은 Google 토큰 | 이메일 미인증 Google 계정 | 탈퇴한 계정' })
```

## 6. DTO 및 타입 정의

```typescript
// src/auth/dto/login-google.dto.ts
export class LoginGoogleDto {
  @ApiProperty({ description: 'Google Identity Services에서 받은 ID 토큰', example: 'eyJhbGciOi...' })
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty()
  idToken: string;
}
```

- `src/auth/types/auth.types.ts`에 `GoogleUserPayload` 타입 추가: `{ sub, email, emailVerified, name }`
- `src/modules/users/types/oauth-user.type.ts`에 `CreateOAuthUserInput` 추가

## 7. Soft Delete 여부

- `User.deletedAt` 존재 → `findUserByOAuth`, `findByEmail`(기존) 조회 시 `deletedAt: null` 조건 필수.
- `UserOAuthAccount`는 soft delete 미사용.

## 8. 트랜잭션 경계

| 메서드 | tx 필요 여부 | 이유 |
| --- | :---: | --- |
| AuthService.loginWithGoogle | $transaction 진입점 | 조회→연결/생성이 원자적이어야 함 (동시 로그인 시 중복 생성 방지) |
| UsersService.getUserByOAuth | tx 전달 | 상위 트랜잭션 안에서 조회 |
| UsersService.linkOAuthAccount | tx 전달 | 상위 트랜잭션 안에서 연결 생성 |
| UsersService.createUserWithGoogle | tx 전달 | User+Profile+OAuthAccount 동시 생성 |

- AuthService에 `PrismaService`를 추가 주입한다 — 컨벤션 3.2 "PrismaService는 $transaction 진입점으로만 사용" 준수.

## 9. 테스트 계획

| 대상 | 케이스 | 검증 방법 |
| --- | --- | --- |
| AuthService.loginWithGoogle | 기존 OAuth 연결 유저 로그인 (happy) | 토큰 쌍 반환, 생성 메서드 미호출 |
| AuthService.loginWithGoogle | 동일 이메일 기존 계정 자동 연결 (happy) | linkOAuthAccount 호출 + 토큰 반환 |
| AuthService.loginWithGoogle | 신규 유저 생성 (happy) | createUserWithGoogle 호출 + 토큰 반환 |
| AuthService.loginWithGoogle | 유효하지 않은 ID 토큰 | UnauthorizedException |
| AuthService.loginWithGoogle | 이메일 미인증 계정 | UnauthorizedException |
| AuthService.loginWithGoogle | 탈퇴 유저 이메일 | UnauthorizedException('탈퇴한 계정입니다.') |
| AuthService.loginWithGoogle | tx 일관성 | capturedTransactions 검증 |
| GoogleAuthClient | 검증 성공 payload 매핑 | google-auth-library 스텁 |
| GoogleAuthClient | 검증 실패 | UnauthorizedException 변환 |
| UsersService.createUserWithGoogle | P2002 → BadRequestException | 실패 스텁 |
| UsersService.linkOAuthAccount | happy + 외부 tx 전달 | 스텁 검증 |

- auth는 TestingModule 허용 예외 모듈이지만, 기존 auth.service.spec.ts 패턴을 따른다.

## 10. 미결 사항

1. **닉네임 기본값**: Google name → 없으면 email local-part로 설계함. 닉네임 중복 허용 여부는 기존 정책(프로필 닉네임 중복 허용 여부) 확인 필요.
2. **Notion 명세**: "유저 api" DB에 #70이 아직 없음 — Notion에 수동 등록 필요 (be-api-sync는 Notion→로컬 단방향).
3. ~~탈퇴 유저의 재로그인~~ → **결정 완료 (2026-09-01)**: (b) 명시적 에러. `UnauthorizedException('탈퇴한 계정입니다.')` — Service 규칙 4장에 반영됨.
4. **공용 DB 마이그레이션 baseline**: `_prisma_migrations` 기록이 없어 신규 마이그레이션 적용 전에 baseline 정리 선행 필요.
5. **환경변수**: `GOOGLE_CLIENT_ID`를 `.env.development`와 Secrets Manager 시크릿에 추가 (사용자가 직접 등록 예정).
6. **프론트 연동**: GIS SDK 연동은 frontend 별도 작업.
