# 밴드 초대 링크·코드 설계

> 대상 모듈: `src/modules/bands`
>
> 관련 API 명세: [밴드 초대 링크 API](../../api-docs/band-invite-link.md)
>
> 결정일: 2026-07-28

## 결정 배경

기존 통합 명세에는 밴드 초대 링크가 `MVP 제외`로만 표시되어 있었고, 가입 승인 방식·코드 만료·재사용·재발급 정책은 정해져 있지 않았다.

현재 직접 초대는 운영자가 특정 사용자를 지정하는 흐름이고, 가입 요청은 사용자가 공개 밴드에 승인을 요청하는 흐름이다. 링크 초대는 운영자가 불특정 사용자에게 가입 권한을 미리 공유하는 방식으로 구분했다. 링크를 사용한 뒤 다시 가입 승인을 받게 하면 기존 가입 요청과 역할이 겹치므로, 유효한 링크 사용자는 즉시 일반 멤버로 가입시킨다.

## 정책

- `BM`과 `ADMIN`만 발급·재발급·폐기 가능
- 공개·비공개 밴드 모두 링크 가입 가능
- 링크 사용자는 별도 승인 없이 `MEMBER`로 즉시 가입
- 차단 사용자는 가입 불가
- 7일 동안 여러 사용자가 재사용 가능
- 밴드당 링크 하나만 유지
- 재발급 시 기존 코드 즉시 무효화
- 폐기 시 링크 row hard delete
- 이미 가입한 사용자는 409
- 가입 성공 시 대기 중 직접 초대와 가입 요청 삭제

## 코드 보안

코드는 `node:crypto.randomInt`로 생성한다. `0`, `O`, `1`, `I`를 제외한 32개 문자에서 16자를 선택해 80비트 경우의 수를 확보한다.

원본 코드는 발급 응답에서 한 번만 반환하고 DB에는 SHA-256 해시를 저장한다. 사용자가 코드를 잃어버린 경우 재발급하며, 재발급과 동시에 기존 코드가 무효화된다.

## 모듈 구성

- `band-invite-links.controller.ts`: 요청 전달과 성공 응답 래핑
- `band-invite-links.service.ts`: 권한·코드·만료·가입 정책
- `repositories/band-invite-links.repository.ts`: Repository 인터페이스
- `repositories/band-invite-links.prisma-repository.ts`: Prisma DB 접근
- `types/band-invite-link.type.ts`: Service와 응답 타입

링크 정책은 기존 `BandsService`에 추가하지 않고 같은 bands 도메인의 별도 Service로 분리한다.

## Repository 인터페이스

```typescript
interface BandInviteLinksRepository {
  findActiveBandWithRequesterMember(bandId, userId, tx?);
  upsertBandInviteLink(input, tx?);
  deleteBandInviteLinkByBandId(bandId, tx?);
  findBandInviteLinkByCodeHash(codeHash, tx?);
  findBandMemberByBandIdAndUserId(bandId, userId, tx?);
  findBandBlacklistByBandIdAndUserId(bandId, userId, tx?);
  createBandMember(bandId, userId, tx?);
  deletePendingBandEntryRequests(bandId, userId, tx?);
}
```

## DB 모델

기존 `band_invite_link.code` 컬럼에는 원본 대신 해시를 저장한다. Prisma 필드명을 `codeHash`로 바꾸고 실제 컬럼명은 유지한다.

```prisma
model BandInviteLink {
  codeHash String? @map("code") @db.VarChar(255)

  @@unique([bandId])
  @@unique([codeHash])
}
```

`bandId` unique는 한 밴드당 링크 하나를, `codeHash` unique는 코드 중복 방지를 보장한다. 기존 데이터 호환을 위해 `codeHash`와 `expiredAt`의 nullable 속성은 유지한다.

## 트랜잭션

- 발급: 권한 조회와 링크 upsert를 같은 transaction client로 실행
- 폐기: 권한 조회와 링크 hard delete를 같은 transaction client로 실행
- 가입: 링크·멤버·차단 조회, 멤버 생성, 대기 항목 삭제를 같은 transaction client로 실행

## 테스트

- BM/ADMIN 발급, 일반 멤버·비멤버 거부
- 7일 만료와 코드 해시 저장
- 링크 폐기 및 없는 링크 처리
- 코드 정규화, 만료·없는 코드 처리
- 중복 멤버와 차단 사용자 처리
- 멤버 생성과 대기 초대·가입 요청 정리
- 트랜잭션 일관성과 외부 tx 전달
- Prisma 조회·upsert·delete·멤버 생성 쿼리
