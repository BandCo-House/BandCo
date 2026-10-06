# 자연어 조회 평가 v2

기존 50문항은 개발·회귀용 합성 질문이다. 평가 규칙을 먼저 고정하고 제품 수정 전후에 같은 조건으로 실행한다. 새 질문 일반화·실제 사용성·권한 전체의 안전성을 이 점수로 주장하지 않는다.

## 비교 계약

- `corpus.ts`의 컬럼 타입·행 순서·동률 정책을 실행 전에 고정한다. SQL 출력 의미로 컬럼을 대응시켜 별칭과 출력 순서 차이는 허용한다. 의미를 대응시킬 수 없는 표현은 `COLUMN_MAPPING_FAILED`로 기록하며 결과값으로 컬럼을 추측하지 않는다.
- 시간순·가나다순을 요구한 문항만 행 순서를 비교한다. 같은 행의 중복 개수는 보존한다.
- G06은 공동 1위 중 한 곡 또는 전체, S13은 공동 1위 중 한 명을 허용한다. 순위가 낮은 항목·중복·빈 결과는 거부한다.
- S12와 S13 통계는 기존 프롬프트의 취소 일정 기본 제외 규칙을 기대 SQL에도 적용한다. S09~S11 목록에는 이 기본값을 확대 적용하지 않는다.
- Decimal·bigint는 문자열 정밀도를 유지한다. 숫자처럼 생긴 문자열 ID는 변환하지 않는다. 이미 안전 범위를 벗어난 Number는 거부한다.
- 사람 수와 참석 일정 수는 고유 멤버·고유 일정으로 센다. 9/1 데이터에서는 멤버당 편성 행이 하나라 기존 COUNT와 같지만, 최신 dev의 다중 세션 데이터에서는 다르다.
- 단일 생성 SQL이 같은 유형의 집계 컬럼을 여러 개 반환하면 의미 대응을 보수적으로 거부한다. 평가기 지원 범위와 제품 실패를 보고서에서 구분한다.

원래 엄격 `37/50`·사후 재판정 `40/50`은 역사적 기록이다. `74% → 80%`를 제품 개선 성과로 계산하지 않는다.

## 모델 없는 검증

```sh
pnpm run test:assistant-evaluation
sh ./scripts/verify.sh
```

평가기 타입 검사·테스트는 전체 verify에 포함되며 모델 키나 DB를 사용하지 않는다. Prisma 계약 테스트는 허용 카탈로그의 존재·관계만 검사하며 DB 전체를 자동으로 허용하지 않는다.

## 합성 DB 준비

백엔드 디렉터리에서 실행한다. 아래 컨테이너는 앱 DB와 분리된 새 로컬 실험 DB다. `prisma db push`는 이 빈 실험 DB에만 적용하며 운영 마이그레이션을 실행하지 않는다. 부분 인덱스 등 Prisma 스키마 밖의 운영 DB 구성은 이 실험에 포함되지 않는다.

```sh
docker run -d --name bandco-assistant-evaluation \
  -e POSTGRES_PASSWORD=assistant-evaluation \
  -e POSTGRES_DB=bandco_assistant_evaluation \
  -p 127.0.0.1:55432:5432 postgres:17-alpine

export ASSISTANT_EVALUATION_DATABASE_URL='postgresql://postgres:assistant-evaluation@127.0.0.1:55432/bandco_assistant_evaluation?schema=public'
DATABASE_URL="$ASSISTANT_EVALUATION_DATABASE_URL" pnpm exec prisma db push --skip-generate
docker exec -i bandco-assistant-evaluation psql -U postgres \
  -d bandco_assistant_evaluation -v ON_ERROR_STOP=1 < scripts/assistant-evaluation/seed-accuracy.sql
mkdir -p _workspace/assistant-evaluation
```

seed는 빈 DB에서 한 번만 실행한다. 스크립트는 전용 로컬 `bandco_assistant_evaluation` URL만 받으며 앱의 `DATABASE_URL`로 자동 대체하지 않는다.

## 자연어 전후 평가

Gemini 키는 `.env.development`에서 읽고 없으면 `.env`를 사용한다. 다른 경로는 `ASSISTANT_EVALUATION_ENV_FILE`로 지정한다. 접속 문자열과 키는 원시 결과에 저장하지 않는다.

```sh
NODE_ENV=test EXPERIMENT_PREFLIGHT_ONLY=true \
  EXPERIMENT_OUTPUT_PATH=_workspace/assistant-evaluation/preflight.json \
  pnpm exec tsx scripts/assistant-evaluation/run-natural.ts

NODE_ENV=test EXPERIMENT_OUTPUT_PATH=_workspace/assistant-evaluation/natural-before.json \
  pnpm exec tsx scripts/assistant-evaluation/run-natural.ts
```

제품을 수정한 뒤 동일 env·DB·평가기·코퍼스에서 `natural-after.json`이라는 새 경로로 실행한다. 고정 시각은 `2026-09-01T00:00:00.000Z`, temperature 0, 요청 동시성 1, 문항 간 기본 간격 4.5초, SQL 재생성 최대 2회다. key/provider rotation은 강제로 OFF이고 provider는 Gemini다. 제공자 timeout·재시도 설정과 실제 모델명은 결과 메타데이터에 기록한다.

기존 결과를 덮어쓰지 않으며 문항마다 중간 결과를 저장한다. 환경·모델 호출이 실패하면 부분 결과를 남기고 평가를 중단한다. 부분 실행의 점수를 50문항 점수로 제시하지 않는다.

이 도구는 Service의 기존 생성 메서드와 Repository 실행 경로를 직접 호출한다. 인증 HTTP 경로와 프론트 화면은 통과하지 않으며, DB 결과 일치를 화면 제공·과업 성공으로 계산하지 않는다. LLM 논리 호출 수는 provider의 내부 재시도 횟수와 다르다. 지연은 생성·검증·실행·평가를 포함하고 HTTP·렌더링은 포함하지 않는다.

## 가설별 고정 SQL 검증

```sh
NODE_ENV=test EXPERIMENT_OUTPUT_PATH=_workspace/assistant-evaluation/catalog-before.json \
  pnpm exec tsx scripts/assistant-evaluation/run-catalog-replay.ts

NODE_ENV=test EXPERIMENT_OUTPUT_PATH=_workspace/assistant-evaluation/session-replay.json \
  pnpm exec tsx scripts/assistant-evaluation/run-session-replay.ts
```

카탈로그 replay는 같은 SQL·파라미터를 테이블명 수정 전후, JOIN 추가 전후, 각 수정 제거 상태에서 비교한다. 결과의 입력 hash가 같아야 직접 비교한다. 실행 전에 거부된 요청은 `databaseCalls: 0`으로 기록한다. 세션 replay는 같은 사람의 편성 행만 추가하고 행 수·고유 인원을 비교한 뒤 트랜잭션을 롤백한다. 원래 50문항 fixture가 복원됐는지도 확인한다.

가설 기록은 관측·경쟁 설명·명제·예측·수집 방법·반증 조건·수용/기각/보류·다음 행동을 포함한다. 전체 정확도 변화와 고정 SQL의 직접 원인 확인은 별도로 판정한다.
