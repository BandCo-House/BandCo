-- 재초대·재가입요청 영구 차단 해소 (#212 B-3)
--
-- band_invitations(band_id, invitee_user_id)와 band_join_requests(band_id, user_id)의
-- 전체 유니크 제약은 상태를 보지 않는다. 그래서 DECLINED/ACCEPTED, REJECTED/APPROVED
-- 이력이 한 건이라도 남으면 같은 사람을 다시 초대하거나 그 사람이 다시 가입 요청을
-- 보내는 일이 영구히 409로 막혔다.
--
-- 중복을 막아야 하는 대상은 "처리 대기 중인 건"뿐이라, PENDING 행에만 걸리는
-- 부분 유니크 인덱스로 바꾼다. 기존 제약보다 약해지는 방향이라 기존 데이터는
-- 그대로 통과한다.
--
-- Prisma 스키마는 조건부(partial) 인덱스를 표현할 수 없어 이 인덱스는 이 파일에만
-- 존재한다. schema.prisma에 주석으로 남겨 두었고, prisma migrate diff는 이 인덱스를
-- 드리프트로 보고한다.

DROP INDEX "band_invitations_band_id_invitee_user_id_key";

CREATE UNIQUE INDEX "band_invitations_band_id_invitee_user_id_pending_key"
  ON "band_invitations"("band_id", "invitee_user_id")
  WHERE "status" = 'PENDING';

DROP INDEX "band_join_requests_band_id_user_id_key";

CREATE UNIQUE INDEX "band_join_requests_band_id_user_id_pending_key"
  ON "band_join_requests"("band_id", "user_id")
  WHERE "status" = 'PENDING';
