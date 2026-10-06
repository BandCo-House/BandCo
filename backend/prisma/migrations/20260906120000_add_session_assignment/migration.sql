-- 일정·팀 참여자에 세션(skill_type) 배정을 추가한다.
-- 한 사람이 보컬·기타를 겸할 수 있어야 해서 unique 키에 skill_type_id를 넣는다.

-- DropIndex
DROP INDEX "schedule_participants_schedule_id_band_member_id_key";

-- DropIndex
DROP INDEX "team_members_team_id_band_member_id_key";

-- AlterTable
ALTER TABLE "schedule_participants" ADD COLUMN     "skill_type_id" UUID;

-- AlterTable
ALTER TABLE "team_members" ADD COLUMN     "skill_type_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "schedule_participants_schedule_id_band_member_id_skill_type_key" ON "schedule_participants"("schedule_id", "band_member_id", "skill_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_band_member_id_skill_type_id_key" ON "team_members"("team_id", "band_member_id", "skill_type_id");

-- AddForeignKey
ALTER TABLE "schedule_participants" ADD CONSTRAINT "schedule_participants_skill_type_id_fkey" FOREIGN KEY ("skill_type_id") REFERENCES "skill_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_skill_type_id_fkey" FOREIGN KEY ("skill_type_id") REFERENCES "skill_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Postgres는 unique 인덱스에서 NULL을 서로 다른 값으로 취급한다. 위 3-컬럼 unique만으로는
-- skill_type_id가 NULL인 행(회의 참여자 / 세션 미배정 팀원)의 중복을 막지 못해,
-- 기존 2-컬럼 unique가 하던 중복 방지가 사라진다. partial unique index로 복구한다.
-- (Prisma 스키마 문법으로는 partial index를 표현할 수 없어 이 마이그레이션에만 존재한다.)
CREATE UNIQUE INDEX "schedule_participants_schedule_member_no_skill_key"
  ON "schedule_participants" ("schedule_id", "band_member_id")
  WHERE "skill_type_id" IS NULL;

CREATE UNIQUE INDEX "team_members_team_member_no_skill_key"
  ON "team_members" ("team_id", "band_member_id")
  WHERE "skill_type_id" IS NULL;
