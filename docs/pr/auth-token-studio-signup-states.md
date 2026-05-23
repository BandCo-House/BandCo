## ⏱ 소요 시간

- 리뷰 예상 시간: 10분

<br/>

## 📌 작업 요약

- 회원가입 폼의 상태 액션을 Figma 시안과 Token Studio 토큰 기준으로 정리합니다.
- `tokens.json`에서 CSS 토큰 파일을 생성해 토큰 업데이트가 화면에 반영되는 경로를 만듭니다.

<br/>

## 📝 작업 내용

1. 회원가입 상태 UI를 `main-main` 토큰 기준의 라인/체크 상태로 정리
2. Token Studio JSON 기반 CSS 변수 생성 스크립트 추가
3. `index.css`가 생성된 토큰 CSS를 import하도록 구조 변경
4. Figma `SHINING BUTTON STYLE`을 공용 `Button`의 `shining` variant로 추가
5. 로그인/회원가입/온보딩 활성 CTA는 `shining`, 온보딩 이전 버튼은 `neutral` variant로 정리
6. auth MSW 핸들러를 백엔드 auth API 경로와 반환 포맷에 맞게 정리
7. access/refresh token 재발급 경로와 Bearer 헤더 전달 방식을 백엔드 계약에 맞게 정리

<br/>

## 🚨 주요 고민 및 해결 과정

### 문제

- 기존 구현은 성공 상태에 `key-muted`를 사용해 다크 모드에서 `primary.light`가 아닌 값으로 바뀔 수 있었습니다.
- `tokens.json`과 `index.css`의 실제 색상 값이 수동으로 어긋난 상태였습니다.

### 해결 과정

- 상태 UI의 성공/불일치/중복 확인 액션은 `main-main` 라인과 체크 아이콘 중심으로 정리합니다.
- `tokens.json`을 읽어 `src/styles/generated-tokens.css`를 생성하는 스크립트를 추가합니다.
- 빛나는 CTA 스타일은 일회성 className이 아니라 공용 버튼 variant로 관리해 로그인, 회원가입, 온보딩이 같은 스타일 계약을 공유하게 했습니다.
- 로그인 화면에서 과하게 보이던 CTA 외곽 glow를 줄이고, 흰색 테두리가 방향별로 명시되도록 보정했습니다.
- 로그인 화면 하단 정책 링크는 회원가입/비밀번호 찾기 행과 같은 2분할 중앙 정렬 레이아웃을 사용하도록 보정했습니다.
- SNS 로그인 버튼은 미연결 상태에서도 시각적으로 탁해 보이지 않도록 disabled opacity를 제거했습니다.
- 입력 focus/hover 강조색은 현재 디자인 토큰 기준에 맞춰 `main-main`으로 변경했습니다.
- 비밀번호 찾기 CTA는 활성 기본값인 `shining` 버튼을 쓰고, 로그인 복귀 링크는 hover underline을 제공합니다.
- 비밀번호 찾기 발송 완료 안내는 강조색 대신 일반 text 색상으로 표시합니다.
- 회원가입 헤더는 투명 배경으로 보정하고, 상태 액션/약관 체크 강조색은 `main-main` 기준으로 맞췄습니다.
- 가입하기 활성 조건은 필수 입력 4개와 필수 약관 동의로 제한했습니다.
- 이메일 중복 확인, 이메일 형식, 비밀번호 형식, 비밀번호 일치 여부는 가입하기 클릭 시 필드 오류로 안내합니다.
- 비밀번호 오류가 표시될 때 기본 helper 문구는 숨기고, 허용 문자 오류와 영문/숫자 조합 오류를 분리해 실제 실패 이유만 안내합니다.
- 백엔드 auth는 로그인/회원가입에서 공통 API wrapper 없이 토큰 쌍을 바로 반환하고, 이메일 확인은 `/auth/email`에서 성공 메시지를 반환하므로 MSW와 auth service 변환 로직을 해당 계약에 맞췄습니다.
- 백엔드 token 재발급은 `/auth/token/access`, `/auth/token/refresh`로 분리되어 있고 body가 아니라 Bearer 헤더를 쓰므로, interceptor와 MSW를 해당 계약에 맞췄습니다.
- 테스트는 스타일 class/variant 속성 검증을 제거하고, 제출 결과와 API 응답 변환 같은 로직 계약 중심으로 정리했습니다.

<br/>

## User-facing changes

- 비밀번호 확인 일치 상태가 체크 아이콘과 `main.main` 라인으로 표시됩니다.
- 로그인/회원가입/온보딩의 활성 CTA가 Figma의 빛나는 버튼 스타일로 표시됩니다.
- SNS 로그인 버튼이 원래 브랜드 색상으로 보이고, 입력 focus 테두리가 `main.main` 색상으로 표시됩니다.
- 비밀번호 찾기와 회원가입 화면의 CTA/헤더/상태 액션이 auth 화면 규칙에 맞게 정리됩니다.
- 회원가입 버튼은 필수 입력/약관이 채워지면 활성화되고, 제출 시점에 형식/중복 확인 오류를 안내합니다.
- 비밀번호가 숫자로만 구성된 경우 허용 문자 안내가 아니라 영문/숫자 조합 안내가 표시됩니다.
- 로그인/회원가입/이메일 확인 mock이 백엔드 auth 응답 포맷과 동일하게 동작합니다.
- 만료된 access token으로 401을 받으면 저장된 refresh token을 Bearer 헤더로 보내 새 access token만 교체합니다.
- Token Studio 색상 토큰 변경 후 생성 스크립트를 실행하면 앱 전역 색상 값이 갱신됩니다.

<br/>

## Verification results

- [x] `pnpm --dir frontend run build`
- [x] `pnpm --dir frontend exec vitest run scripts/__tests__/generate-css-tokens.test.mjs src/shared/ui/button/button.test.tsx src/features/auth/ui/LoginForm.test.tsx src/features/auth/ui/SignupForm.test.tsx src/features/onboarding/ui/OnboardingFlow.test.tsx`
- [x] `pnpm --dir frontend exec vitest run src/features/auth/api/auth.service.test.ts src/features/auth/ui/SignupForm.test.tsx src/features/auth/ui/LoginForm.test.tsx`
- [x] `pnpm --dir frontend exec vitest run src/features/auth/ui/SignupForm.test.tsx src/shared/ui/button/button.test.tsx src/features/onboarding/ui/OnboardingFlow.test.tsx src/features/auth/api/auth.service.test.ts`
- [x] `pnpm --dir frontend exec vitest run src/shared/api/client.test.ts src/features/auth/api/auth.service.test.ts`
- [x] `pnpm --dir frontend exec vitest run src/shared/ui/input.test.tsx src/shared/ui/social-login-section.test.tsx src/features/auth/ui/LoginForm.test.tsx`
- [x] `pnpm --dir frontend exec vitest run src/features/auth/ui/SignupForm.test.tsx src/shared/ui/input.test.tsx src/shared/ui/social-login-section.test.tsx src/app/router.test.tsx src/widgets/page-header/page-header.test.tsx src/widgets/page-header/resolve-header.test.ts`
- [x] `pnpm --dir frontend exec vitest run src/features/auth/ui/SignupForm.test.tsx src/app/router.test.tsx`
- [x] `pnpm --dir frontend exec vitest run src/features/auth/ui/SignupForm.test.tsx`
- [x] `pnpm --dir frontend exec vitest run src/features/auth/model/auth.schema.test.ts src/features/auth/ui/SignupForm.test.tsx`
- [x] `pnpm exec eslint scripts/generate-css-tokens.mjs scripts/__tests__/generate-css-tokens.test.mjs src/shared/ui/button/button-variants.ts src/shared/ui/button/button.test.tsx src/features/auth/ui/LoginForm.tsx src/features/auth/ui/LoginForm.test.tsx src/features/auth/ui/SignupForm.tsx src/features/auth/ui/SignupForm.test.tsx src/features/onboarding/ui/OnboardingFlow.tsx src/features/onboarding/ui/OnboardingFlow.test.tsx`
- [x] `pnpm exec eslint src/features/auth/api/auth.service.ts src/features/auth/api/auth.service.test.ts src/features/auth/ui/SignupForm.test.tsx src/mocks/auth/handlers.ts`
- [x] `pnpm exec eslint src/shared/api/client.ts src/shared/api/client.test.ts src/shared/api/config.ts src/shared/api/index.ts src/mocks/auth/handlers.ts`
- [x] `pnpm --dir frontend exec eslint src/features/auth/ui/SignupForm.tsx src/features/auth/ui/SignupForm.test.tsx`
- [x] `pnpm --dir frontend exec eslint src/features/auth/model/auth.schema.ts src/features/auth/model/auth.schema.test.ts src/features/auth/ui/SignupForm.tsx src/features/auth/ui/SignupForm.test.tsx`
- [x] `pnpm exec prettier --check scripts/generate-css-tokens.mjs scripts/__tests__/generate-css-tokens.test.mjs src/shared/ui/button/button-variants.ts src/shared/ui/button/button.test.tsx src/features/auth/ui/LoginForm.tsx src/features/auth/ui/LoginForm.test.tsx src/features/auth/ui/SignupForm.tsx src/features/auth/ui/SignupForm.test.tsx src/features/onboarding/ui/OnboardingFlow.tsx src/features/onboarding/ui/OnboardingFlow.test.tsx src/index.css src/styles/generated-tokens.css`
- [x] `pnpm exec prettier --check src/features/auth/api/auth.service.ts src/features/auth/api/auth.service.test.ts src/features/auth/ui/SignupForm.test.tsx src/mocks/auth/handlers.ts`
- [x] `pnpm exec prettier --check src/shared/api/client.ts src/shared/api/client.test.ts src/shared/api/config.ts src/shared/api/index.ts src/mocks/auth/handlers.ts`
- [x] `pnpm --dir frontend exec prettier --check src/features/auth/ui/SignupForm.tsx src/features/auth/ui/SignupForm.test.tsx ../docs/pr/auth-token-studio-signup-states.md`
- [ ] `pnpm --dir frontend run lint` - 기존 `src/widgets/page-header/notification-sheet.tsx` hook lint 에러로 실패
- [ ] `pnpm --dir frontend exec vitest run` - 병렬 전체 실행에서 기존 헤더/버튼 테스트 2건이 timeout, 실패 파일 단독 재실행은 통과

<br/>

## 📑 참고 문서/ ADR

- Figma: https://www.figma.com/design/aaWoovc3smAZNnGCt3SowV/Design--%EB%B3%B5%EC%82%AC-?node-id=1595-20114&m=dev

<br/>

## 💬 리뷰 요구사항

- `ColorSystem Dark/Dark.main` 토큰의 semantic alias가 현재 앱의 `primary`/`key` 의미와 맞는지 확인해주세요.
