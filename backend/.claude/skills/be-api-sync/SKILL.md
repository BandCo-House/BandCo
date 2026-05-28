---
name: be-api-sync
description: Notion에서 백엔드 모듈의 API 명세를 MCP로 가져와 docs/backend/api-docs/{module}.md에 저장하는 스킬. "Notion API 가져와줘", "api-docs 동기화", "API 명세 불러와줘", "[모듈] API 문서 받아와", "api-docs 업데이트", "Notion에서 [모듈] 명세 내려받아" 요청 시 트리거한다. be-orchestrate가 Phase 1에서 내부적으로 사용하며 독립적으로도 트리거 가능하다.
---

# Be-API-Sync — Notion API 명세 동기화 스킬

Notion의 API 명세를 `docs/backend/api-docs/{module}.md`로 가져온다. 분석하거나 설계하지 않는다.

## Step 1: 모듈 확인

어떤 모듈의 API 명세를 가져올지 확인한다. 모듈명이 명시되지 않았으면 사용자에게 확인한다.

모듈 목록: `auth`, `users`, `bands`, `spaces`, `songs`, `notifications`, `skills`

## Step 2: Notion 페이지 검색

아래 순서로 검색한다:

```
도구: mcp__claude_ai_Notion__notion-search
쿼리 순서:
  1. "{모듈명} API"
  2. "{모듈명} 명세"
  3. "{모듈명} endpoint"
```

검색 결과에서 API 명세 페이지를 특정한다. 찾지 못하면 사용자에게 Notion 페이지 URL 또는 ID를 요청한다.

## Step 3: 페이지 내용 가져오기

```
도구: mcp__claude_ai_Notion__notion-fetch
입력: Step 2에서 찾은 페이지 URL 또는 ID
```

## Step 4: 형식 변환 및 저장

Notion 내용을 아래 형식으로 변환해 `docs/backend/api-docs/{module}.md`에 저장한다.

**응답 형식 변환 규칙:**
- 모든 성공 응답은 `{ "data": ..., "success": true }` 형태로 변환한다
- Notion 원본이 이 형태와 다르면 변환하되, 파일 상단 "변환 노트"에 차이를 기록한다

**출력 파일 형식:**

```markdown
# {모듈명} API

> 최종 동기화: {YYYY-MM-DD} | Notion: {페이지 URL}
>
> ⚠️ 변환 노트: (차이점 있으면 기록, 없으면 이 줄 삭제)

---

## {HTTP 메서드} {경로}

**설명:** {엔드포인트 설명}
**인증:** 필요 (JWT Bearer) / 불필요

### Request

**Path Parameters** (없으면 생략)
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|

**Query Parameters** (없으면 생략)
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|:----:|:-----:|------|

**Body** (없으면 생략)
```json
{}
```

### Response 200

```json
{
  "data": { ... },
  "success": true
}
```

### Error Responses

| 코드 | 조건 |
|------|------|
| 400 | 잘못된 입력 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |

---
```

## Step 5: Gap 리포트 출력

저장 완료 후 아래 형식으로 명세 완성도를 보고한다.

```markdown
## API 명세 동기화 완료

파일: docs/backend/api-docs/{module}.md
엔드포인트: {N}개 ({목록})

### 명세 완성도

| 엔드포인트 | 요청 | 응답 필드 | 에러 코드 | 인증 |
|-----------|:----:|:--------:|:--------:|:----:|
| GET /xxx  | ✅   | ✅        | ⚠️ 누락  | ✅   |

### 보완 필요 항목

아래 항목은 설계 단계에서 자동 보완 가능한 것과 사용자 확인이 필요한 것으로 구분한다.

**자동 보완 가능** (schema 또는 컨벤션 기반):
- GET /xxx: 응답 필드 누락 → prisma/schema.prisma 기반으로 채울 수 있음
- POST /yyy: 에러 코드 누락 → 표준 400/401/403/404 적용 가능

**사용자 확인 필요** (비즈니스 로직 결정):
- PATCH /zzz: 요청 필드 필수/선택 여부 불명확
- (없으면 이 섹션 생략)
```

보완 필요 항목이 없으면 "명세 완성도 이상 없음"으로 보고한다.
