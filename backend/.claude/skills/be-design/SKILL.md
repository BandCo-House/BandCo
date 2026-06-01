---
name: be-design
description: JamPlay 백엔드 모듈의 설계 문서를 작성하는 스킬. "설계해줘", "인터페이스 정의해줘", "API 설계", "어떻게 구현할지 계획 세워줘", "구현 전에 먼저 설계", "모듈 구조 잡아줘" 요청 시 트리거한다. be-orchestrate 스킬이 내부적으로 사용하며, 독립적으로도 트리거 가능하다. 코드 구현은 하지 않는다.
---

# Be-Design — 백엔드 설계 스킬

백엔드 모듈 구현 전 설계 문서를 작성한다. 구현 없이 설계만 수행한다.

## 설계 전 필수 준비

아래 순서로 읽은 뒤 설계한다. 건너뛰지 않는다.

1. **API 명세 읽기**: `docs/backend/api-docs/{module}.md`가 있으면 반드시 읽는다. **API 명세가 설계의 1차 소스다.**
2. **스키마 확인**: `prisma/schema.prisma`에서 관련 모델과 필드를 확인한다 — API 명세 보완 시 기준이 된다
3. **API 명세 보완**: 명세가 불완전하면 아래 "API 명세 검증 및 보완" 섹션에 따라 보완하고 api-docs 파일을 업데이트한다
4. **컨벤션 읽기**: `docs/backend/conventions.md`를 읽는다 — DTO·레이어 책임·soft delete·tx 패턴·네이밍 규칙의 단일 공급원이다
5. **모듈 doc 읽기**: `CLAUDE.md`의 모듈 문서 테이블에서 관련 모듈 doc 경로를 찾아 읽는다
6. **기존 구현 참고**: 관련 모듈의 실제 구현 파일이 있으면 읽어 패턴을 파악한다

## API 명세 검증 및 보완

`docs/backend/api-docs/{module}.md`를 읽었다면 아래 항목을 검증한다.
`be-api-sync`는 Notion 원본을 그대로 저장하므로 명세가 불완전할 수 있다. **불완전한 항목은 직접 보완하고 api-docs 파일을 업데이트한다.**

### 검증 체크리스트

- [ ] 각 엔드포인트의 HTTP 메서드와 경로가 명시되어 있는가?
- [ ] 요청 Body/Params/Query가 명시되어 있는가?
- [ ] 성공 응답이 `{ "data": ..., "success": true }` 형태인가?
- [ ] Error 응답 (400/401/403/404)이 명시되어 있는가?
- [ ] 사용자 요청과 API 명세가 일치하는가? 불일치 시 "미결 사항"에 기록

### 보완 기준

| 불완전 항목                | 처리 방법                                           |
| -------------------------- | --------------------------------------------------- |
| 응답 필드 누락             | `prisma/schema.prisma` 모델 필드 기반으로 자동 보완 |
| 에러 코드 누락             | 컨벤션 표준(400/401/403/404) 기반으로 자동 보완     |
| 성공 응답 형태 불일치      | `ApiSuccessResponse<T>` 형식으로 자동 변환          |
| 요청 필드 필수/선택 불명확 | "미결 사항"에 기록하고 사용자 확인                  |
| 비즈니스 로직 결정 필요    | "미결 사항"에 기록하고 사용자 확인                  |
| 엔드포인트 자체 누락       | "미결 사항"에 기록하고 사용자 확인                  |

### api-docs 파일 업데이트 방법

보완한 내용은 api-docs 파일에 인라인으로 반영하고, 파일 상단 `⚠️ 변환 노트`에 보완 내역을 요약한다:

```markdown
> ⚠️ 변환 노트: [설계자 보완 {YYYY-MM-DD}] 응답 필드 누락 → schema 기반 보완, 에러 코드 추가
```

보완 후 `_workspace/design.md` 작성을 계속한다.

## 설계 문서 작성

`_workspace/design.md`에 아래 내용을 작성한다. 각 항목은 생략하지 않는다. 해당 사항이 없으면 "없음"으로 명시한다.

---

### 1. 작업 범위

신규 파일과 기존 파일 수정을 구분해서 나열한다:

```
신규:
- src/modules/users/dto/update-nickname.dto.ts

수정:
- src/modules/users/users.repository.ts  (updateNickname 메서드 추가)
- src/modules/users/users.prisma-repository.ts  (구현 추가)
- src/modules/users/users.service.ts  (updateNickname 메서드 추가)
```

---

### 2. Repository 인터페이스 변경

추가할 메서드 시그니처. JSDoc 주석 포함:

```typescript
/**
 * 사용자 닉네임을 업데이트한다.
 */
updateNickname(
  userId: string,
  nickname: string,
  tx?: Prisma.TransactionClient,
): Promise<User>;
```

---

### 3. Service 비즈니스 규칙

각 메서드의 처리 흐름과 예외 조건을 단계별로 명시한다:

```
updateNickname(userId, nickname, tx?):
1. 사용자 조회 → 없거나 deletedAt이 있으면 NotFoundException
2. 닉네임 중복 확인 → 중복이면 BadRequestException("이미 사용 중인 닉네임입니다.")
3. nickname 필드 업데이트
4. 업데이트된 User 반환
```

---

### 4. API 번호 및 Swagger

> **규칙 기준:** `docs/backend/conventions.md` Section 10 (Swagger 데코레이터)

작업 대상 API의 번호를 명시한다:

- **기존 API**: `docs/backend/api-docs/{module}.md`에서 해당 엔드포인트의 `#N` 번호를 찾아 기록한다.
- **신규 API**: 파일의 마지막 `#N` 번호 + 1을 부여하고, api-docs 파일에도 추가한다.

예: `#3 POST /bands/invite — 신규 (기존 최대 #2 기준)`

Controller에 추가할 Swagger 데코레이터 목록:

```typescript
@ApiOperation({ summary: '...' })
@ApiResponse({ status: 200, description: '...' })
@ApiResponse({ status: 400, description: '잘못된 입력' })
```

### 5. DTO 및 타입 정의

> **규칙 기준:** `docs/backend/conventions.md` Section 4 (DTO 규칙), Section 10 (Swagger)

설계 문서에 아래를 명시한다:

- 요청 DTO 클래스명과 필드 목록 (class-validator 데코레이터 + `@ApiProperty` 포함)
- Service 내부 반환 타입이 필요하면 `types/{name}.type.ts` 파일명

---

### 6. Soft Delete 여부

> **규칙 기준:** `docs/backend/conventions.md` Section 8 (Soft Delete)

조회 메서드를 설계할 때 관련 모델에 `deletedAt`이 있는지 `prisma/schema.prisma`에서 확인한다.
`deletedAt`이 있으면 `where: { deletedAt: null }` 조건 필요 여부를 설계 문서에 명시한다.

### 7. 트랜잭션 경계

`tx?` 인자가 필요한 메서드와 이유:

| 메서드         | tx 필요 여부 | 이유                                   |
| -------------- | :----------: | -------------------------------------- |
| updateNickname |     필요     | 중복 확인과 업데이트를 원자적으로 처리 |

---

### 8. 테스트 계획

새 Service 메서드별 필수 테스트 케이스:

| 메서드         | 케이스       | 검증 방법                                      |
| -------------- | ------------ | ---------------------------------------------- |
| updateNickname | happy path   | 올바른 결과 반환 확인                          |
| updateNickname | 사용자 없음  | NotFoundException 발생                         |
| updateNickname | 닉네임 중복  | BadRequestException 발생                       |
| updateNickname | tx 일관성    | capturedTransactions 검증                      |
| updateNickname | 외부 tx 전달 | createPrismaServiceFailingTransactionStub 사용 |

---

### 9. 미결 사항

모호하거나 추가 확인이 필요한 항목을 나열한다.

---

## 설계 품질 자가 확인

설계 문서를 작성한 뒤 아래 항목을 확인한다:

- [ ] Service 메서드마다 예외 조건이 명시되었는가?
- [ ] Repository 메서드가 인터페이스에 선언되었는가?
- [ ] tx 경계가 명확한가?
- [ ] 테스트 케이스가 happy path + NotFoundException + ForbiddenException + BadRequestException + tx 일관성 + 외부 tx를 포함하는가?
- [ ] Prisma 모델과 설계가 일치하는가? (`prisma/schema.prisma` 기준)
- [ ] DTO 필드에 `@ApiProperty`가 포함되었는가?
- [ ] Controller 메서드에 Swagger 데코레이터(`@ApiOperation`, `@ApiResponse`)가 명시되었는가?
- [ ] 작업 대상 API의 `#N` 번호가 명시되었는가? (신규면 마지막 번호 + 1)
- [ ] 미결 사항이 있으면 명시했는가?
