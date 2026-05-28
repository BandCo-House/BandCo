---
name: be-design
description: JamPlay 백엔드 모듈의 설계 문서를 작성하는 스킬. "설계해줘", "인터페이스 정의해줘", "API 설계", "어떻게 구현할지 계획 세워줘", "구현 전에 먼저 설계", "모듈 구조 잡아줘" 요청 시 트리거한다. be-orchestrate 스킬이 내부적으로 사용하며, 독립적으로도 트리거 가능하다. 코드 구현은 하지 않는다.
---

# Be-Design — 백엔드 설계 스킬

백엔드 모듈 구현 전 설계 문서를 작성한다. 구현 없이 설계만 수행한다.

## 설계 전 필수 준비

아래 순서로 읽은 뒤 설계한다. 건너뛰지 않는다.

1. **API 명세 읽기**: `docs/backend/api-docs/{module}.md`가 있으면 반드시 읽는다. **API 명세가 설계의 1차 소스다.**
2. **모듈 doc 읽기**: `CLAUDE.md`의 모듈 문서 테이블에서 관련 모듈 doc 경로를 찾아 읽는다
3. **스키마 확인**: `prisma/schema.prisma`에서 관련 모델과 필드를 확인한다
4. **기존 구현 참고**: 관련 모듈의 실제 구현 파일이 있으면 읽어 패턴을 파악한다

## API 명세 검증

`docs/backend/api-docs/{module}.md`를 읽었다면 아래 항목을 검증한다.
문제가 있으면 설계 문서의 "미결 사항"에 명시하고 사용자에게 확인을 요청한다.

- [ ] 각 엔드포인트의 HTTP 메서드와 경로가 명시되어 있는가?
- [ ] 요청 Body/Params/Query가 명시되어 있는가?
- [ ] 성공 응답이 `{ "data": ..., "success": true }` 형태인가?
- [ ] Error 응답 (400/401/403/404)이 명시되어 있는가?
- [ ] 사용자 요청과 API 명세가 일치하는가? 불일치 시 "미결 사항"에 기록

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

### 4. DTO 및 타입 정의

**규칙:**
- 요청 DTO는 `dto/` 디렉토리, class-validator 데코레이터 필수
- Service 내부 반환 타입은 `types/{name}.type.ts`에 별도 정의 (DTO에 넣지 않음)
- 복잡한 로직 검증 (예: `from > to`)은 DTO가 아닌 Service에서 처리

```typescript
// dto/update-nickname.dto.ts
export class UpdateNicknameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nickname: string;
}

// types/update-nickname-result.type.ts
export interface UpdateNicknameResult { ... }
```

---

### 5. Soft Delete 여부

조회 메서드를 설계할 때 관련 모델에 `deletedAt`이 있는지 확인한다.

**`deletedAt`이 있는 기존 모델:** `Band`, `User`, `BandSpace`
→ 이 모델을 조회하는 Repository 메서드에는 `where: { deletedAt: null }` 조건이 필요하다. 설계 문서에 명시한다.

신규 모델에는 특별한 이유 없이 `deletedAt`을 추가하지 않는다.

### 6. 트랜잭션 경계

`tx?` 인자가 필요한 메서드와 이유:

| 메서드 | tx 필요 여부 | 이유 |
|--------|:-----------:|------|
| updateNickname | 필요 | 중복 확인과 업데이트를 원자적으로 처리 |

---

### 7. 테스트 계획

새 Service 메서드별 필수 테스트 케이스:

| 메서드 | 케이스 | 검증 방법 |
|--------|--------|-----------|
| updateNickname | happy path | 올바른 결과 반환 확인 |
| updateNickname | 사용자 없음 | NotFoundException 발생 |
| updateNickname | 닉네임 중복 | BadRequestException 발생 |
| updateNickname | tx 일관성 | capturedTransactions 검증 |
| updateNickname | 외부 tx 전달 | createPrismaServiceFailingTransactionStub 사용 |

---

### 8. 미결 사항

모호하거나 추가 확인이 필요한 항목을 나열한다.

---

## 설계 품질 자가 확인

설계 문서를 작성한 뒤 아래 항목을 확인한다:

- [ ] Service 메서드마다 예외 조건이 명시되었는가?
- [ ] Repository 메서드가 인터페이스에 선언되었는가?
- [ ] tx 경계가 명확한가?
- [ ] 테스트 케이스가 happy path + NotFoundException + ForbiddenException + BadRequestException + tx 일관성 + 외부 tx를 포함하는가?
- [ ] Prisma 모델과 설계가 일치하는가? (`prisma/schema.prisma` 기준)
- [ ] 미결 사항이 있으면 명시했는가?
