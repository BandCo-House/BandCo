-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('LEADER', 'MEMBER');

-- AlterEnum
BEGIN;
CREATE TYPE "AttendanceStatus_new" AS ENUM ('PENDING', 'ATTENDING', 'ABSENT');
ALTER TABLE "schedule_participants" ALTER COLUMN "attendance_status" TYPE "AttendanceStatus_new" USING (
  CASE
    WHEN "attendance_status" IS NULL THEN NULL
    WHEN "attendance_status"::text = 'ATTEND' THEN 'ATTENDING'
    WHEN "attendance_status"::text = 'ABSENT' THEN 'ABSENT'
    ELSE 'PENDING'
  END::"AttendanceStatus_new"
);
ALTER TYPE "AttendanceStatus" RENAME TO "AttendanceStatus_old";
ALTER TYPE "AttendanceStatus_new" RENAME TO "AttendanceStatus";
DROP TYPE "AttendanceStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ScheduleType_new" AS ENUM ('PRACTICE', 'MEETING');
ALTER TABLE "schedules" ALTER COLUMN "schedule_type" TYPE "ScheduleType_new" USING (
  CASE
    WHEN "schedule_type" IS NULL THEN NULL
    WHEN "schedule_type"::text = 'PRACTICE' THEN 'PRACTICE'
    WHEN "schedule_type"::text = 'MEETING' THEN 'MEETING'
    ELSE 'PRACTICE'
  END::"ScheduleType_new"
);
ALTER TYPE "ScheduleType" RENAME TO "ScheduleType_old";
ALTER TYPE "ScheduleType_new" RENAME TO "ScheduleType";
DROP TYPE "ScheduleType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ScheduleStatus_new" AS ENUM ('PLANNED', 'DONE', 'CANCELED');
ALTER TABLE "schedules" ALTER COLUMN "status" TYPE "ScheduleStatus_new" USING (
  CASE
    WHEN "status" IS NULL THEN NULL
    WHEN "status"::text = 'SCHEDULED' THEN 'PLANNED'
    WHEN "status"::text = 'CANCELLED' THEN 'CANCELED'
    WHEN "status"::text = 'DONE' THEN 'DONE'
    ELSE 'PLANNED'
  END::"ScheduleStatus_new"
);
ALTER TYPE "ScheduleStatus" RENAME TO "ScheduleStatus_old";
ALTER TYPE "ScheduleStatus_new" RENAME TO "ScheduleStatus";
DROP TYPE "ScheduleStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "band_invitations" DROP CONSTRAINT "band_invitations_inviter_user_id_fkey";

-- DropForeignKey
ALTER TABLE "band_members" DROP CONSTRAINT "band_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "space_members" DROP CONSTRAINT "space_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "space_members" DROP CONSTRAINT "space_members_space_id_fkey";

-- DropForeignKey
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_band_space_id_fkey";

-- DropForeignKey
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "schedule_participants" DROP CONSTRAINT "schedule_participants_user_id_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_target_schedule_id_fkey";

-- DropForeignKey
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_user_id_fkey";

-- AlterTable
ALTER TABLE "bands" DROP COLUMN "invite_code",
ADD COLUMN     "cover_img_url" TEXT;

-- AlterTable
ALTER TABLE "band_invitations" DROP COLUMN "invitation_token",
ADD COLUMN     "message" TEXT;
ALTER TABLE "band_invitations" RENAME COLUMN "inviter_user_id" TO "inviter_band_member_id";

-- AlterTable
ALTER TABLE "band_members" RENAME COLUMN "user_id" TO "band_member_id";

-- AlterTable
ALTER TABLE "places" ADD COLUMN     "image_url" VARCHAR(255);

-- AlterTable
ALTER TABLE "band_spaces" ALTER COLUMN "start_date" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "end_date" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "space_members" RENAME COLUMN "space_id" TO "band_space_id";
ALTER TABLE "space_members" RENAME COLUMN "user_id" TO "band_member_id";

-- AlterTable
ALTER TABLE "songs" ADD COLUMN     "status" VARCHAR(20);

-- AlterTable
ALTER TABLE "schedules" RENAME COLUMN "created_by_user_id" TO "band_member_id";

-- AlterTable
ALTER TABLE "schedule_participants" RENAME COLUMN "user_id" TO "band_member_id";

-- AlterTable
ALTER TABLE "teams" DROP COLUMN "target_schedule_id",
ADD COLUMN     "team_cover_url" VARCHAR(255);
ALTER TABLE "teams" RENAME COLUMN "note" TO "description";

-- AlterTable
ALTER TABLE "team_members" RENAME COLUMN "user_id" TO "band_member_id";
ALTER TABLE "team_members" ADD COLUMN "team_role" "TeamMemberRole" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "team_songs" DROP COLUMN "created_at";

-- CreateTable
CREATE TABLE "band_genres" (
    "id" UUID NOT NULL,
    "band_id" UUID NOT NULL,
    "genres_id" UUID NOT NULL,

    CONSTRAINT "band_genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_invite_link" (
    "id" UUID NOT NULL,
    "band_id" UUID NOT NULL,
    "create_user_id" UUID NOT NULL,
    "code" VARCHAR(255),
    "expired_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "band_invite_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_team" (
    "id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,

    CONSTRAINT "schedule_team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_song" (
    "id" UUID NOT NULL,
    "song_id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,

    CONSTRAINT "schedule_song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_space_team" (
    "id" UUID NOT NULL,
    "band_space_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,

    CONSTRAINT "band_space_team_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "band_genres" ADD CONSTRAINT "band_genres_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "bands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_genres" ADD CONSTRAINT "band_genres_genres_id_fkey" FOREIGN KEY ("genres_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_invitations" ADD CONSTRAINT "band_invitations_inviter_band_member_id_fkey" FOREIGN KEY ("inviter_band_member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_invite_link" ADD CONSTRAINT "band_invite_link_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "bands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_invite_link" ADD CONSTRAINT "band_invite_link_create_user_id_fkey" FOREIGN KEY ("create_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_members" ADD CONSTRAINT "band_members_band_member_id_fkey" FOREIGN KEY ("band_member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_members" ADD CONSTRAINT "space_members_band_space_id_fkey" FOREIGN KEY ("band_space_id") REFERENCES "band_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_members" ADD CONSTRAINT "space_members_band_member_id_fkey" FOREIGN KEY ("band_member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_band_space_id_fkey" FOREIGN KEY ("band_space_id") REFERENCES "band_spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_band_member_id_fkey" FOREIGN KEY ("band_member_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_participants" ADD CONSTRAINT "schedule_participants_band_member_id_fkey" FOREIGN KEY ("band_member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_team" ADD CONSTRAINT "schedule_team_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_team" ADD CONSTRAINT "schedule_team_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_song" ADD CONSTRAINT "schedule_song_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_song" ADD CONSTRAINT "schedule_song_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_band_member_id_fkey" FOREIGN KEY ("band_member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_space_team" ADD CONSTRAINT "band_space_team_band_space_id_fkey" FOREIGN KEY ("band_space_id") REFERENCES "band_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_space_team" ADD CONSTRAINT "band_space_team_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
