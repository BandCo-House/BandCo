# 어드민 콘솔 운영

어드민 콘솔은 서비스 유저와 분리된 운영자 계정(`admin_users`)으로 로그인한다. 프론트는 별도 저장소 [BandCo-House/bandco-admin](https://github.com/BandCo-House/bandco-admin)의 앱이고 서비스와 다른 서브도메인(`admin.<서비스 도메인>`)으로 연다. 같은 출처에 두면 서비스 앱의 스크립트가 어드민 토큰(`localStorage`)을 읽을 수 있어 출처를 나눴다. API는 백엔드의 `/admin/*` 경로다. 배포 구성은 [bandco-admin README](https://github.com/BandCo-House/bandco-admin#readme)를 본다. API 명세는 [api-docs/admin.md](../api-docs/admin.md)에 있다.

## 배포 전에 준비할 것

### 1. `ADMIN_JWT_SECRET` 추가

어드민 토큰은 유저 토큰과 다른 시크릿으로 서명한다. 값이 없거나 `JWT_SECRET`과 같으면 서버가 시작하지 않는다.

- 로컬: `backend/.env.development`에 추가한다.
- 운영: Secrets Manager `bandco/prod/backend`에 `ADMIN_JWT_SECRET` 키를 추가한다. 배포 워크플로가 이 키가 없으면 마이그레이션 전에 멈춘다.

```bash
# 충분히 긴 임의 값 생성
openssl rand -base64 48
```

### 2. S3 목록 조회 권한

대시보드의 스토리지 사용량은 버킷 전체를 `ListObjectsV2`로 훑는다. 서버 자격 증명에 버킷 ARN(`arn:aws:s3:::<버킷>`) 대상 `s3:ListBucket` 권한이 없으면 이 카드만 실패하고 나머지 기능은 동작한다. 버킷은 Lightsail Object Storage라 액세스 키 권한은 Lightsail 콘솔에서 확인한다.

### 3. 마이그레이션

`20261005120000_add_admin_console`은 테이블 6개와 enum 4개를 새로 만들고 기존 테이블은 바꾸지 않는다. main 배포 시 파이프라인의 `migrate deploy`가 적용한다.

## 첫 SUPER_ADMIN 만들기

어드민 회원가입 API는 없다. 첫 계정은 CLI로 만들고, 이후 계정은 콘솔의 "어드민 계정" 화면에서 SUPER_ADMIN이 만든다.

스크립트는 `.env` 파일을 읽지 않는다. `.env.development`가 운영 DB를 가리키고 있어, 대상 DB를 명령줄에서 직접 지정하게 했다. `--yes` 없이 실행하면 대상 DB 호스트만 보여주고 끝난다.

```bash
cd backend
DATABASE_URL='postgresql://...' ADMIN_EMAIL=me@bandco.kr ADMIN_NAME=홍길동 ADMIN_PASSWORD='8~72자' \
  pnpm run admin:create            # 대상 DB 확인
DATABASE_URL='postgresql://...' ADMIN_EMAIL=me@bandco.kr ADMIN_NAME=홍길동 ADMIN_PASSWORD='8~72자' \
  pnpm run admin:create -- --yes   # 실제 생성
```

## 역할

| 역할 | 할 수 있는 일 |
|---|---|
| SUPER_ADMIN | 전부. 어드민 계정 관리, 서비스 설정(점검 모드·최소 버전) 변경, 전체 알림 발송은 SUPER_ADMIN만 가능 |
| OPERATOR | 위 세 가지를 뺀 조회·회원·밴드·신고·공지·마스터 데이터 관리 |

모든 쓰기 작업과 로그인은 `admin_audit_logs`에 남고 콘솔의 "감사 로그" 화면에서 볼 수 있다.

## 서비스 동작에 생기는 변화

- **마지막 접속 시각**: 이메일·Google 로그인, 회원가입, 액세스 토큰 재발급 때 `users.last_login_at`을 갱신한다(10분 안의 재갱신은 생략). 대시보드 DAU/WAU/MAU의 근거이며 배포 이후부터 쌓인다.
- **이용 정지**: 활성 정지가 있는 유저는 로그인 시 403과 해제 예정 시각 안내를 받는다. 이미 발급된 토큰은 다음 요청부터 401로 끊긴다.
- **점검 모드**: 켜면 `/admin*`, `/service-status`, `/announcements/active`, `/api-docs*`를 뺀 모든 요청이 503을 받는다. 설정은 서버 메모리에 10초 캐시되므로 다른 인스턴스에는 최대 10초 늦게 반영된다. 서비스 앱은 점검 화면을 띄우고 30초마다 다시 확인한다.
- **최소 앱 버전**: 서비스 앱 버전은 `frontend/package.json`의 `version`이고 지금은 `0.0.0`이다. 앱은 배포된 버전(`/version.json`)이 최소 버전 이상일 때만 업데이트 화면을 띄우므로, 아직 배포하지 않은 버전을 넣으면 아무도 막히지 않는다. 앱 버전을 먼저 올려 배포한 뒤 설정한다.
- **어드민 로그인 보호**: 같은 이메일로 성공 없이 10번 시도하면 15분 잠긴다(동시 요청 포함, 서버 재시작 시 초기화). 잠긴 계정을 바로 풀어야 하면 서버를 재시작한다.
- **어드민 계정 보호**: 활성 SUPER_ADMIN이 한 명뿐이면 그 계정은 강등·비활성화할 수 없다. 본인 비밀번호는 "비밀번호 재설정"이 아니라 상단 "비밀번호 변경"으로 바꾼다.

## 로컬에서 확인하기

운영 DB를 건드리지 않으려면 로컬 Postgres를 쓰고 `DATABASE_URL`을 셸에서 직접 지정한다. 셸 환경 변수가 `.env.development`보다 우선한다.

기존 마이그레이션 이력은 빈 DB에서 처음부터 재생되지 않는다(`20260505142911_sync_current_ddl`이 없는 제약을 지우려다 실패). 로컬 DB는 스키마를 바로 반영해 만든다.

```bash
cd backend
export DATABASE_URL=postgresql://<user>:<pw>@localhost:<port>/<db>   # 반드시 로컬
pnpm exec prisma db push --skip-generate
# 장르·세션 마스터 데이터
sed -n '/^INSERT INTO/,$p' prisma/migrations/20260913120000_seed_genres_and_skill_types/migration.sql > /tmp/seed.sql
pnpm exec prisma db execute --file /tmp/seed.sql --url "$DATABASE_URL"
# 첫 어드민
ADMIN_EMAIL=admin@bandco.local ADMIN_NAME=로컬관리자 ADMIN_PASSWORD='admin1234!' pnpm run admin:create -- --yes
# 서버
ADMIN_JWT_SECRET=local-admin-secret pnpm run start:dev
```

어드민 프론트는 [bandco-admin](https://github.com/BandCo-House/bandco-admin) 저장소에서 `pnpm dev`로 띄운다(`http://localhost:5174`, 기본 API 주소 `http://localhost:3000`).

서비스 앱(`frontend/`)은 개발 모드에서 항상 MSW 목업을 켜므로 실제 서버로 확인하려면 빌드해서 띄운다.

```bash
cd frontend
VITE_API_BASE_URL=http://localhost:3000 pnpm run build && pnpm exec vite preview --port 5173
```
