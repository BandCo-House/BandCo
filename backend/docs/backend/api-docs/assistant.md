# 자연어 밴드 조회 API 명세

밴드 멤버가 자연어로 질문하면 LLM이 PostgreSQL `SELECT`를 생성하고, 서버가 밴드 범위와 허용 스키마를 검증한 뒤 읽기 전용 transaction에서 실행한다.

## API 목록

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/assistant/presets` | 추천 질문 목록 조회 |
| POST | `/bands/:bandId/assistant/query` | 자연어로 밴드 데이터 조회 |

두 API 모두 AccessToken 인증이 필요하다.

자연어 질문 API는 인증 사용자별 5분에 10회로 제한한다. 추천 질문 목록 조회는 LLM을 호출하지 않아 제한 대상에서 제외한다.

## 추천 질문 목록 조회

### Response 200

```json
{
  "status": "success",
  "error": null,
  "message": "추천 질문 목록 조회 성공",
  "data": {
    "presets": [
      {
        "id": "next-schedule",
        "label": "다음 합주",
        "question": "다음 합주 일정이 언제야?"
      }
    ]
  }
}
```

## 자연어로 밴드 데이터 조회

- Method: `POST`
- Path: `/bands/:bandId/assistant/query`
- 인증: AccessToken

`question`과 `presetId` 중 하나를 전달한다. `presetId`는 모델을 호출하지 않고 서버에 정의된 고정 SELECT를 자유 질문과 같은 검증기로 확인한 뒤 실행한다(`meta.usedLlm: false`). 추천 질문은 가장 많이 눌리는 질문이라 답의 컬럼이 매번 같아야 하기 때문이다. `label`은 홈 화면의 짧은 칩 이름이다.

### Request

```json
{
  "question": "우리 밴드에 사람 몇 명 있어?"
}
```

또는

```json
{
  "presetId": "next-schedule"
}
```

### Response 201

```json
{
  "status": "success",
  "error": null,
  "message": "조회 성공",
  "data": {
    "answerable": true,
    "kind": "ANSWER",
    "summary": "밴드 멤버 수: 3",
    "result": {
      "entity": "table",
      "title": "밴드 멤버 수",
      "columns": [{ "key": "member_count", "label": "멤버 수", "format": "plain" }],
      "rows": [{ "member_count": 3 }],
      "hasMore": false,
      "maxRows": 50,
      "resultMode": "AGGREGATE",
      "conditions": []
    },
    "clarification": null,
    "meta": {
      "providerName": "gemini",
      "modelName": "gemini-3.1-flash-lite",
      "usedLlm": true,
      "inputTokens": 1200,
      "outputTokens": 120,
      "latencyMs": 950
    }
  }
}
```

조회에 성공하면 결론 한 줄인 `summary`와 실제 행을 담은 `table` 결과를 함께 반환한다. 요약은 행을 나열하지 않는다(목록 "다음 합주 미응답자 10명", 상위 N개 "…: 1위 이름 외 2건", 단일 값 "…: 13"). 행은 `rows`로 최대 50행을 제공하고, 50건 초과 안내는 화면이 결과 아래에 한 번만 보여준다. `result.title`은 결과 제목(SQL의 intent)이다.

`kind`는 화면이 다음 행동을 고르는 기준이다. `answerable`은 호환을 위해 유지하며 `kind === 'ANSWER'`일 때만 true다.

| kind | 의미 | result | clarification |
|---|---|---|---|
| `ANSWER` | 조회 성공 | table | null |
| `UNSUPPORTED` | 밴드 데이터로 답할 수 없는 질문. `summary`가 사유 | null | null |
| `CLARIFICATION` | 이름 후보 중 선택이 필요함 | null | 후보 배열 |
| `REPHRASE` | 재생성까지 안전한 SQL을 만들지 못함. 장애가 아니라 질문을 바꾸면 해결될 수 있음 | null | null |

`REPHRASE`는 예전에는 503이었다. 사용자가 질문을 고치면 해결되는 상황을 장애로 안내하지 않으려고 HTTP 201 응답으로 바꿨다. 평가 도구는 서비스 내부의 생성 실패 예외를 그대로 `generation_failed`로 집계한다.

- `LIST`: 최상위 모델 LIMIT을 AST에서 제거하고 서버가 최대 51행을 읽는다. 응답은 50행까지이고 51번째 행이 있으면 `hasMore: true`다. 내부 일정 선택의 LIMIT은 보존하며 OFFSET은 허용하지 않는다.
- `TOP_N`: 요청한 상위 개수의 1~50 LIMIT을 보존한다. 숫자 상수 또는 INTEGER 파라미터의 실제 바인딩값이 정수 1~50인 경우만 허용한다. 표현식·다른 타입·범위 밖 값은 거부한다. `AGGREGATE`는 GROUP BY 없는 집계 값이며 입력 행을 목록 제한으로 자르지 않는다. 결과 유형이 없는 호환 입력은 기존 쿼리의 LIMIT을 보존하는 `LEGACY`다.
- `hasMore: false`는 실행한 쿼리에서 추가 행이 발견되지 않았다는 뜻이다. TOP_N이나 호환 쿼리의 의미상 LIMIT 밖에 데이터가 없다는 뜻은 아니다. 연속 조회·커서는 아직 제공하지 않는다.
- 셀은 문자열·숫자·불리언·null이다. bigint와 Decimal은 문자열로 정밀도를 보존하고 Date는 ISO 문자열로 전달한다. `columns.format: datetime`은 화면에서 한국 시간으로 표시한다.
- `conditions`는 서버가 실제 SQL AST와 바인딩 값에서 확인한 표시 가능한 필터다. 최상위 AND 조건 하나가 칩 하나다(예: `일정 종류: 합주`, `일정 상태: 취소 제외`, `시작: 지금 이후`, `시작: 8월 1일 ~ 8월 31일`). enum은 한글로, 시각은 한국 시간으로 바꾸고, 생성 시각 기준 비교는 "지금"으로, 같은 항목의 시작·끝은 기간 하나로 합친다. 화면용 이름이 없는 컬럼과 지원하지 않는 표현은 추정해 설명하지 않고 생략한다. 모델이 작성한 설명을 그대로 반환하지 않는다.
- `columns.label`은 화면용 짧은 이름이다. 이름을 알 수 없는 집계 별칭은 영문 별칭 대신 `인원`, `개수`, `평균`, `값` 같은 일반 이름을 쓴다.

### Error

| 코드 | 사유 |
|---|---|
| 400 | 질문과 추천 질문 ID가 없거나 입력 형식이 잘못됨 |
| 401 | 인증 실패 |
| 403 | 해당 밴드의 멤버가 아님 |
| 404 | 추천 질문 ID를 찾을 수 없음 |
| 429 | 사용자별 질문 요청 횟수 초과 |
| 503 | 모델 호출 장애, 검증된 SQL 실행 실패, 이름 확인 DB 장애 |

인원·참석 횟수가 명확한 질문은 다중 세션 참여·팀 편성의 최상위 COUNT 단위도 검증한다. 인원은 고유 멤버, 참석 횟수는 고유 일정으로 센다. 명시적 편성 행 수와 여러 집계 단위가 섞인 질문에는 이 보수적 규칙을 강제하지 않는다. 이는 모든 SQL 의미의 정확성을 보장하는 검증이 아니다.

참여·팀 편성 테이블은 검증 후 (일정, 멤버)·(팀, 멤버)마다 ID가 가장 작은 대표 행만 담은 관계로 변환한 뒤 JOIN한다. 외부 JOIN의 보존 행을 WHERE에서 제거하지 않는다. 모델이 작성한 파생 테이블을 새로 허용하는 것은 아니다. 현재 ID·응답 시각·가입 시각 등의 출력도 대표 행의 값이며, 비대표 세션 행을 직접 찾는 조회는 이 사람 단위 관계에 포함되지 않는다. 참석 상태가 세션마다 다를 때의 합의 정책은 별도로 정해야 한다.

아티스트 이름은 SQL 검증 후 현재 밴드에 등록된 이름과 대조한다. 최상위 AND의 `songs.artist_name = TEXT 파라미터`에서 그 값이 다른 조건·출력·하위 쿼리에 공유되지 않을 때만 적용한다. SQL의 나머지 조건과 구조는 유지하고 실제 이름의 바인딩만 확인한다. OR·NOT·LIKE와 내부 쿼리의 이름은 자동 보정하지 않는다.

정확 일치나 유일 후보는 실제 이름으로 조회한다. 질문에 나온 더 완전한 이름이 유일하게 확인되면 우선한다. 따옴표로 명시한 이름이 실제 이름과 다르면 단일 후보여도 확인을 요청한다. 후보가 없으면 원래 이름으로 빈 목록을 조회한다. 후보가 모호하거나 5개를 넘으면 HTTP 201의 `kind: CLARIFICATION`, `result: null`과 `clarification.candidates`로 확인을 요청한다. 후보마다 `question`이 있고, 질문 속 이름을 따옴표 친 후보로 바꾼 문장이다. 화면은 후보 칩을 누르면 이 문장을 그대로 다시 보낸다. 추가 모델 호출은 없다.

```json
{
  "answerable": false,
  "kind": "CLARIFICATION",
  "summary": "어떤 아티스트인가요? 밴드에 등록된 비슷한 이름은 \"아티스트 A\", \"아티스트 B\"이에요.",
  "result": null,
  "clarification": {
    "candidates": [{ "name": "아티스트 A", "question": "'아티스트 A' 곡 알려줘" }],
    "hasMore": false
  }
}
``` 후보는 현재 밴드·삭제 조건 안에서 최대 6개만 조회하며 이름 확인 DB 장애는 503이다.
