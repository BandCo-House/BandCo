# 자연어 조회 품질 분석

`assistant_query_logs` 한 행이 조회 한 건이다. 사용자에게 보여주지 않고 품질 측정에만 쓴다.

## 먼저 알아야 할 것 — `exec_ok`는 "맞았다"가 아니다

| 컬럼 | 뜻 | 누가 채우나 |
| --- | --- | --- |
| `exec_ok` | 검증을 통과해 읽기 전용 트랜잭션에서 실행까지 끝났다 | 서버 (결정론) |
| `answered` | 질문에 실제로 답했다 | **아직 아무도 채우지 않는다. 항상 NULL** |
| `signals` | 의심할 만한 자리 | 서버 (결정론) |
| `bucket` | 결정론으로 정할 수 있는 분류 하나 | 서버 (결정론) |
| `outcome` | 어느 단계에서 끝났는지 | 서버 (결정론) |

`exec_ok = true`인데 질문과 어긋난 답일 수 있다. 그 경우를 코드가 직접 알 수는 없으므로
`signals`로 "의심할 자리"만 모으고, 판정은 사람·모델이 붙을 때 `answered`에 쓴다.

> **`exec_ok = true`를 성공률로 보고하지 않는다.** 그 숫자는 "실행이 됐다"는 뜻뿐이다.
> 질문 충족률은 `answered`가 채워진 뒤에만 말할 수 있다.

## 신호 목록

| 신호 | 기준 | 의심하는 것 |
| --- | --- | --- |
| `EMPTY_RESULT` | 실행 성공 + 0행 | 조건을 너무 좁게 걸었다 |
| `ZERO_VALUE` | 단일 집계 값이 0 또는 NULL | JOIN이 끊겼다 |
| `ROW_LIMIT_REACHED` | 서버 상한 50행에 걸렸다 | 질문이 목록을 좁히지 못했다 |
| `REGENERATED` | SQL을 다시 만들었다 | 프롬프트가 못 잡은 자리 |
| `POLICY_VIOLATION` | 허용 목록 밖 테이블·함수·쓰기 시도 | 질문이 경계를 시험했다 |
| `MISSING_DATE_FILTER` | 질문에 기간 표현이 있는데 SQL에 시간 조건이 없다 | 전체 기간을 집계했다 |

## 재질문 — 가장 싼 오답 탐지기

**이 신호는 저장하지 않고 질의로 계산한다.** 쓰기 시점에 앞 턴을 다시 읽어야 하고,
유사도 기준을 고치면 이미 저장한 행이 낡기 때문이다. 기준을 바꿔도 과거 데이터를
다시 해석할 수 있게 `session_id`·`turn_index`·`question`만 남긴다.

```sql
-- 같은 대화에서 60초 안에 비슷한 질문을 다시 한 경우.
-- 앞 답이 틀렸거나 안 통했다는 사람의 신호다.
WITH turns AS (
  SELECT id, session_id, turn_index, question, created_at, bucket, exec_ok,
         LAG(question)   OVER w AS prev_question,
         LAG(created_at) OVER w AS prev_created_at,
         LAG(id)         OVER w AS prev_id
  FROM assistant_query_logs
  WHERE session_id IS NOT NULL AND question IS NOT NULL
  WINDOW w AS (PARTITION BY session_id ORDER BY turn_index)
)
SELECT prev_id AS suspect_log_id, prev_question, question AS reasked_as, created_at
FROM turns
WHERE prev_question IS NOT NULL
  AND created_at - prev_created_at < interval '60 seconds'
  -- 어휘가 절반 넘게 겹치면 같은 의도의 재질문으로 본다. 기준은 데이터를 보고 조정한다.
  AND similarity(prev_question, question) > 0.5
ORDER BY created_at DESC;
```

`similarity`는 `pg_trgm` 확장이 필요하다. 없으면 `prev_question = question`(완전 일치)으로
시작해도 쓸 만하다. 확장을 켜는 것은 별도 결정이라 이 PR에 넣지 않았다.

## 자주 보는 질의

```sql
-- 분류별 분포 (최근 7일)
SELECT bucket, count(*) AS n, round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS pct
FROM assistant_query_logs
WHERE created_at >= now() - interval '7 days'
GROUP BY bucket ORDER BY n DESC;
```

```sql
-- 신호가 붙은 비율. answered가 비어 있는 동안 품질을 가늠하는 대용 지표다.
SELECT count(*) FILTER (WHERE signals <> '{}') AS suspect,
       count(*) AS total,
       round(100.0 * count(*) FILTER (WHERE signals <> '{}') / count(*), 1) AS suspect_pct
FROM assistant_query_logs
WHERE created_at >= now() - interval '7 days' AND exec_ok;
```

```sql
-- 턴별 실패율. 대화 상한(5턴)의 근거를 만드는 자리다.
SELECT turn_index, count(*) AS n,
       round(100.0 * count(*) FILTER (WHERE NOT exec_ok OR signals <> '{}') / count(*), 1) AS trouble_pct
FROM assistant_query_logs
WHERE turn_index IS NOT NULL
GROUP BY turn_index ORDER BY turn_index;
```

```sql
-- 장애를 단계별로 가른다. bucket이 INFRA인 것만으로는 생성 장애와 실행 장애가 섞인다.
SELECT outcome, count(*) AS n
FROM assistant_query_logs
WHERE bucket = 'INFRA' AND created_at >= now() - interval '7 days'
GROUP BY outcome ORDER BY n DESC;
```

```sql
-- 경계를 시험한 질문. 재생성 횟수에 묻히지 않게 따로 본다.
SELECT created_at, question, policy_violations
FROM assistant_query_logs
WHERE policy_violations <> '{}'
ORDER BY created_at DESC LIMIT 50;
```

```sql
-- 코퍼스 승격 후보. 사람이 주 1회 소수만 고르고 질문 원문을 고치지 않는다.
SELECT id, question, bucket, signals, created_at
FROM assistant_query_logs
WHERE NOT promoted_to_corpus AND question IS NOT NULL AND signals <> '{}'
ORDER BY created_at DESC LIMIT 20;
```

## 운영 규칙

- **보관 90일.** 질문 원문을 담으므로 레포 밖으로 내보내지 않는다. 평가 결과를 저장소에
  두지 않는 규칙(`scripts/assistant-evaluation/evaluation-environment.ts`)과 같은 이유다.
- **끄는 법:** `ASSISTANT_QUERY_LOG_ENABLED=false`. 끄면 stdout 로그만 남고 조회는 그대로 동작한다.
- 기록 실패는 조회를 막지 않고 `warn`으로만 남는다. 측정이 제품을 막으면 측정을 끄게 된다.
