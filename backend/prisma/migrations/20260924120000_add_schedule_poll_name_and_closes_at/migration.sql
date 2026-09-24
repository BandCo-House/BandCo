-- 일정 조율 투표에 이름·마감 기한을 추가한다.
-- 기존 행은 기본 이름과 '생성일 + 7일' 마감으로 백필한 뒤 NOT NULL을 확정한다.

-- AlterTable
ALTER TABLE "schedule_polls" ADD COLUMN "name" VARCHAR(50) NOT NULL DEFAULT '일정 투표';
ALTER TABLE "schedule_polls" ALTER COLUMN "name" DROP DEFAULT;

ALTER TABLE "schedule_polls" ADD COLUMN "closes_at" TIMESTAMPTZ(6);
UPDATE "schedule_polls" SET "closes_at" = "created_at" + interval '7 days';
ALTER TABLE "schedule_polls" ALTER COLUMN "closes_at" SET NOT NULL;
