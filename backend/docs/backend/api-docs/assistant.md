# 자연어 밴드 조회 API 명세

밴드 멤버가 자연어로 질문하면 LLM이 PostgreSQL `SELECT`를 생성하고, 서버가 밴드 범위와 허용 스키마를 검증한 뒤 읽기 전용 transaction에서 실행한다.

## API 목록

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/assistant/presets` | 추천 질문 목록 조회 |
| POST | `/bands/:bandId/assistant/query` | 자연어로 밴드 데이터 조회 |

두 API 모두 AccessToken 인증이 필요하다.

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
    "result": null,
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

MVP에서는 기존 프론트 응답 계약을 유지하기 위해 자유 질의 결과를 `summary`에 표시하고 `result`는 `null`로 반환한다. 밴드 데이터로 답할 수 없는 질문도 HTTP 오류가 아니라 `answerable: false`와 사유를 반환한다.

### Error

| 코드 | 사유 |
|---|---|
| 400 | 질문과 추천 질문 ID가 없거나 입력 형식이 잘못됨 |
| 401 | 인증 실패 |
| 403 | 해당 밴드의 멤버가 아님 |
| 404 | 추천 질문 ID를 찾을 수 없음 |
| 503 | 제한 횟수 안에 검증 가능한 SQL을 생성하지 못했거나 실행 실패 |
