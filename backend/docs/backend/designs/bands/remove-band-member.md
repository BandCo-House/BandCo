# 밴드 멤버 강퇴 설계

> 작성일: 2026-09-06 · 대상 모듈: `src/modules/bands` · API 명세: `docs/backend/api-docs/band.md` #71

## 배경

FE–BE 계약 감사(`docs/backend/api-contract-audit.md` B2)에서 프론트 밴드 설정 화면(`BandMemberSettings`)이 `DELETE /bands/:bandId/users/:userId`를 호출하지만 백엔드에 라우트가 없어 404가 나는 것을 확인했다.

## 작업 범위

```
신규: src/modules/bands/types/remove-band-member-result.type.ts
수정: bands.service.ts (removeBandMember), bands.controller.ts (DELETE :bandId/users/:userId), bands.service.spec.ts, api-docs/band.md
```

## Repository

신규 메서드 없음. 멤버 행 삭제는 나가기와 동일하므로 `leaveBand(bandMemberId, tx)`를 재사용한다. 조회는 `findActiveBandById`, `findBandMemberByBandIdAndUserId`.

## Service 규칙 (`removeBandMember(requesterUserId, bandId, targetUserId, tx?)`)

1. 밴드 없음/삭제 → NotFoundException
2. 요청자 ≠ 밴드장 → ForbiddenException (권한 변경 #9와 동일하게 BM만 허용)
3. 대상 = 밴드장 → BadRequestException
4. 대상 멤버 없음 → NotFoundException
5. `leaveBand(member.id)` 후 `{ bandId, userId, removed: true }` 반환
6. 조회→삭제를 하나의 `$transaction`으로 묶고, 외부 tx가 있으면 그대로 전달

## DB 모델

`BandMember` 행 삭제. 스키마 변경 없음.

## 테스트 계획

happy path / NotFound(밴드, 멤버) / Forbidden / BadRequest / 외부 tx 전달 — `bands.service.spec.ts`
