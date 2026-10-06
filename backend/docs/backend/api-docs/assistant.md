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

`question`과 `presetId` 중 하나를 전달한다. `presetId`도 저장된 질문 문장으로 바꾼 뒤 같은 Text-to-SQL 경로로 처리한다.

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
    "summary": "밴드 멤버 수 조회: 3",
    "result": {
      "entity": "table",
      "columns": [{ "key": "member_count", "label": "멤버 수", "format": "plain" }],
      "rows": [{ "member_count": 3 }],
      "hasMore": false,
      "maxRows": 50,
      "resultMode": "AGGREGATE",
      "conditions": []
    },
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

조회에 성공하면 `summary`와 실제 행을 담은 `table` 결과를 함께 반환한다. 요약은 앞 5행을 설명하지만 `rows`에는 최대 50행을 제공한다. 밴드 데이터로 답할 수 없는 질문은 HTTP 오류가 아니라 `answerable: false`, 사유, `result: null`로 반환한다.

- `LIST`: 최상위 모델 LIMIT을 AST에서 제거하고 서버가 최대 51행을 읽는다. 응답은 50행까지이고 51번째 행이 있으면 `hasMore: true`다. 내부 일정 선택의 LIMIT은 보존하며 OFFSET은 허용하지 않는다.
- `TOP_N`: 요청한 상위 개수의 1~50 LIMIT을 보존한다. `AGGREGATE`는 GROUP BY 없는 집계 값이며 입력 행을 목록 제한으로 자르지 않는다. 결과 유형이 없는 호환 입력은 기존 쿼리의 LIMIT을 보존하는 `LEGACY`다.
- `hasMore: false`는 실행한 쿼리에서 추가 행이 발견되지 않았다는 뜻이다. TOP_N이나 호환 쿼리의 의미상 LIMIT 밖에 데이터가 없다는 뜻은 아니다. 연속 조회·커서는 아직 제공하지 않는다.
- 셀은 문자열·숫자·불리언·null이다. bigint와 Decimal은 문자열로 정밀도를 보존하고 Date는 ISO 문자열로 전달한다. `columns.format: datetime`은 화면에서 한국 시간으로 표시한다.
- `conditions`는 서버가 실제 SQL AST와 바인딩 값에서 확인한 표시 가능한 필터다. 전체 SQL 의미의 설명을 보장하지 않으며 지원하지 않는 표현은 추정해 설명하지 않는다. 모델이 작성한 설명을 그대로 반환하지 않는다.

### Error

| 코드 | 사유 |
|---|---|
| 400 | 질문과 추천 질문 ID가 없거나 입력 형식이 잘못됨 |
| 401 | 인증 실패 |
| 403 | 해당 밴드의 멤버가 아님 |
| 404 | 추천 질문 ID를 찾을 수 없음 |
| 429 | 사용자별 질문 요청 횟수 초과 |
| 503 | 제한 횟수 안에 검증 가능한 SQL을 생성하지 못했거나 실행 실패 |

인원·참석 횟수가 명확한 질문은 다중 세션 참여·팀 편성의 최상위 COUNT 단위도 검증한다. 인원은 고유 멤버, 참석 횟수는 고유 일정으로 센다. 명시적 편성 행 수와 여러 집계 단위가 섞인 질문에는 이 보수적 규칙을 강제하지 않는다. 이는 모든 SQL 의미의 정확성을 보장하는 검증이 아니다.
