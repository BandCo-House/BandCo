# BandCo 어드민 콘솔

BandCo(JamPlay) 운영용 데스크톱 웹 앱이다. 서비스 앱(`frontend/`)과 분리된 별도 Vite 프로젝트이며, Vercel에도 별도 프로젝트로 배포하고 서비스 도메인의 `/admin` 경로로 연다.

- 스택: Vite + React 19 + TypeScript, TanStack Router(코드 기반 라우트 트리), TanStack Query, axios, Tailwind CSS v4, lucide-react, sonner
- API 계약: `backend/docs/backend/api-docs/admin.md`

## 어드민 계정

어드민 계정은 서비스 회원(`users`)과 **완전히 분리된** `admin_users` 계정이다. 서비스 회원 계정으로는 로그인할 수 없고, 회원가입도 없다.

- 첫 계정(SUPER_ADMIN)은 백엔드에서 CLI로 만든다.

  ```bash
  cd backend
  pnpm run admin:create
  ```

- 이후 계정은 SUPER_ADMIN이 콘솔의 **어드민 계정** 메뉴에서 만든다.
- 역할
  - `SUPER_ADMIN`(최고 관리자): 모든 기능
  - `OPERATOR`(운영자): 어드민 계정 관리, 서비스 설정 변경, 전체 알림 발송을 제외한 모든 기능

## 접근 경로와 배포

어드민 콘솔은 서비스 도메인의 `/admin` 경로로 연다(예: `https://<서비스 도메인>/admin`). 코드·배포는 서비스 앱과 분리돼 있고, 서비스 앱의 `frontend/vercel.json`이 `/admin/*` 요청을 이 앱의 배포로 넘긴다(rewrite 프록시).

- 이 앱은 기준 경로 `/admin/`으로 빌드되고 결과는 `dist/admin/`에 생긴다. 라우터도 `basepath: '/admin'`이다.
- Vercel 프로젝트: Root Directory `admin`, Framework Vite, Output Directory `dist`(기본값), 환경 변수 `VITE_API_BASE_URL`=운영 백엔드 주소.
- 프로젝트 이름을 `bandco-admin`으로 만들면 기본 주소가 `https://bandco-admin.vercel.app`이 되어 `frontend/vercel.json`을 고칠 필요가 없다. 이름이 다르면 그 파일의 두 rewrite 주소를 바꾼다.
- 어드민 프로젝트에 Vercel 배포 보호(Deployment Protection)를 켜면 서비스 도메인에서 프록시로 불러올 때도 막힐 수 있다. 켤 경우 서비스 도메인의 `/admin`이 열리는지 확인한다.
- 서비스 앱 로그인 화면에는 어드민으로 가는 링크를 두지 않았다. 운영자는 주소로 직접 들어간다.

## 환경 변수

| 이름                | 설명            | 기본값                  |
| ------------------- | --------------- | ----------------------- |
| `VITE_API_BASE_URL` | 백엔드 API 주소 | `http://localhost:3000` |

로컬에서 다른 주소를 쓰려면 `admin/.env.local`(git 미추적)에 적는다.

```bash
VITE_API_BASE_URL=http://localhost:3000
```

## 실행

```bash
cd admin
pnpm install
pnpm dev          # http://localhost:5174/admin/
```

서비스 앱 개발 서버(5173)를 함께 띄우면 `http://localhost:5173/admin`으로도 열린다(서비스 앱 Vite 프록시). 배포와 같은 주소 구조를 확인할 때 쓴다.

## 빌드·검증

```bash
pnpm run build    # tsc -b && vite build → dist/admin/
pnpm run lint     # eslint + prettier --check
pnpm test -- --run
```

## 구조

```
src/
  app/        라우터, provider, 레이아웃(사이드바·상단 바), URL 검색 파라미터 검증
  pages/      화면 단위 컴포넌트
  features/   영역별 API 함수·React Query 훅·타입·라벨·전용 컴포넌트
  shared/     API 클라이언트(토큰 재발급), 토큰 저장소, 포맷 유틸, 공용 UI
```

## 인증 동작

- 로그인 성공 시 access/refresh 토큰을 `localStorage`의 `bandco-admin.accessToken`, `bandco-admin.refreshToken`에 저장한다.
- 401을 받으면 refresh 토큰으로 `POST /admin/auth/token/access`를 한 번 호출해 재시도한다. 동시에 여러 요청이 401을 받아도 재발급은 한 번만 일어난다.
- 재발급에 실패하면 토큰을 지우고 `/admin/login`으로 보낸다.
- 화면의 모든 날짜는 KST(`YYYY-MM-DD HH:mm`)로 표시하고, `datetime-local` 입력도 KST로 해석해 ISO로 보낸다.
