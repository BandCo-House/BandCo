# 설계: #70 GET /bands/{bandId} — 밴드 단건 조회

## API 번호

**#70 GET /bands/{bandId}** — 새 API (전체 api-docs 최대 #69 기준)

---

## 작업 범위

```
신규: src/modules/bands/types/get-band-result.type.ts
수정: src/modules/bands/repositories/bands.repository.ts     (findBandDetail 메서드 추가)
      src/modules/bands/repositories/bands.prisma-repository.ts (findBandDetail 구현 추가)
      src/modules/bands/bands.service.ts                      (getBand 메서드 추가)
      src/modules/bands/bands.service.spec.ts                 (getBand 테스트 추가)
      src/modules/bands/bands.controller.ts                   (getBand 핸들러 추가)
      docs/backend/api-docs/band.md                           (#70 섹션 추가)
```

---

## API 명세

**인증:** 불필요 (공개 API — #11, #12와 동일하게 가입 전 미리보기 허용)

### Request

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| bandId | string (UUID) | ✅ | 조회할 밴드 ID |

### Response 200

```json
{
  "data": {
    "band": {
      "id": "a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1",
      "name": "합주하자",
      "description": "주 1회 합주하는 밴드입니다.",
      "visibility": true,
      "coverImgUrl": "https://cdn.example.com/bands/cover.png",
      "bandMasterUserId": "11111111-1111-1111-1111-111111111111",
      "genres": [
        { "id": "0f0a4e3a-8a0c-4f6e-9d2d-9c1a8c6b7b1a", "name": "rock" },
        { "id": "3f2a4e3a-8a0c-4f6e-9d2d-9c1a8c6b7b2b", "name": "jazz" }
      ],
      "memberCount": 5,
      "createdAt": "2026-03-03T18:20:10.123Z"
    }
  },
  "success": true
}
```

### Error

| 코드 | 사유 |
|------|------|
| 400 | `bandId`가 UUID 형식이 아님 |
| 404 | 밴드 없음 (삭제된 밴드 포함) |

---

## Repository 인터페이스 변경

`bands.repository.ts`에 추가:

```typescript
/**
 * bandId로 삭제되지 않은 밴드 상세 정보를 조회한다.
 */
findBandDetail(
  bandId: string,
  tx?: Prisma.TransactionClient,
): Promise<GetBandResult['band'] | null>;
```

---

## Service 비즈니스 규칙

```
getBand(bandId, tx?):
1. bandsRepository.findBandDetail(bandId, tx) 호출
2. null이면 → NotFoundException('요청한 밴드를 찾을 수 없습니다.')
3. { band } 형태로 반환
```

---

## 트랜잭션 경계

단순 단건 조회이므로 `$transaction` 불필요. 하네스 규칙에 따라 `tx?: Prisma.TransactionClient`는 유지하고 직접 전달한다.

---

## 테스트 계획

| 메서드 | 케이스 | 패턴 |
|--------|--------|------|
| getBand | happy path | findBandDetail이 밴드 반환 → `{ band }` 그대로 반환 |
| getBand | 밴드 없음 | findBandDetail이 null → NotFoundException |
| getBand | 외부 tx 전달 | tx 인자가 findBandDetail에 전달되는지 toBe 단언 |

---

## 미결 사항

없음
