/*
  Warnings:

  - The values [PRACTICE_ROOM,STUDIO,ETC] on the enum `BandSpaceType` will be removed. If these variants are still used in the database, this will fail.
  - The values [UNKNOWN] on the enum `SongKey` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUSPENDED] on the enum `UserStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `genres_id` on the `band_genres` table. All the data in the column will be lost.
  - You are about to drop the column `create_user_id` on the `band_invite_link` table. All the data in the column will be lost.
  - You are about to drop the column `band_member_id` on the `band_members` table. All the data in the column will be lost.
  - You are about to drop the column `created_by_user_id` on the `band_spaces` table. All the data in the column will be lost.
  - You are about to drop the column `band_member_id` on the `schedules` table. All the data in the column will be lost.
  - You are about to drop the column `created_by_user_id` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `team_leader_user_id` on the `teams` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[band_id,user_id]` on the table `band_blacklists` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[band_id,genre_id]` on the table `band_genres` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[band_id,invitee_user_id]` on the table `band_invitations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[band_id,user_id]` on the table `band_join_requests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[band_id,user_id]` on the table `band_members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[band_space_id,team_id]` on the table `band_space_team` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,genre_id]` on the table `favor_genres` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schedule_id,band_member_id]` on the table `schedule_participants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[song_id,skill_type_id]` on the table `song_skills` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[band_space_id,band_member_id]` on the table `space_members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[team_id,band_member_id]` on the table `team_members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[team_id,song_id]` on the table `team_songs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,skill_type_id]` on the table `user_skills` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `genre_id` to the `band_genres` table without a default value. This is not possible if the table is not empty.
  - Added the required column `create_band_member_id` to the `band_invite_link` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `band_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by_band_member_id` to the `band_spaces` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `band_spaces` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `band_spaces` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `bands` required. This step will fail if there are existing NULL values in that column.
  - Made the column `visibility` on table `bands` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `genres` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `notifications` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `places` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `places` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `places` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `created_by_band_member_id` to the `schedules` table without a default value. This is not possible if the table is not empty.
  - Made the column `title` on table `schedules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `schedule_type` on table `schedules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `schedules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `skill_types` required. This step will fail if there are existing NULL values in that column.
  - Made the column `band_id` on table `songs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `songs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `artist_name` on table `songs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `teams` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `teams` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_primary` on table `user_skills` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BandSpaceType_new" AS ENUM ('PERFORMANCE', 'PRACTICE', 'ONLINE');
ALTER TABLE "band_spaces" ALTER COLUMN "space_type" TYPE "BandSpaceType_new" USING ("space_type"::text::"BandSpaceType_new");
ALTER TYPE "BandSpaceType" RENAME TO "BandSpaceType_old";
ALTER TYPE "BandSpaceType_new" RENAME TO "BandSpaceType";
DROP TYPE "public"."BandSpaceType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SongKey_new" AS ENUM ('C', 'CM', 'D', 'DM', 'E', 'EM', 'F', 'FM', 'G', 'GM', 'A', 'AM', 'B', 'BM');
ALTER TABLE "songs" ALTER COLUMN "key" TYPE "SongKey_new" USING ("key"::text::"SongKey_new");
ALTER TYPE "SongKey" RENAME TO "SongKey_old";
ALTER TYPE "SongKey_new" RENAME TO "SongKey";
DROP TYPE "public"."SongKey_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserStatus_new" AS ENUM ('ACTIVE', 'INACTIVE');
ALTER TABLE "public"."users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
DROP TYPE "public"."UserStatus_old";
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "band_genres" DROP CONSTRAINT "band_genres_genres_id_fkey";

-- DropForeignKey
ALTER TABLE "band_invitations" DROP CONSTRAINT "band_invitations_inviter_band_member_id_fkey";

-- DropForeignKey
ALTER TABLE "band_invite_link" DROP CONSTRAINT "band_invite_link_create_user_id_fkey";

-- DropForeignKey
ALTER TABLE "band_members" DROP CONSTRAINT "band_members_band_member_id_fkey";

-- DropForeignKey
ALTER TABLE "band_spaces" DROP CONSTRAINT "band_spaces_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "schedule_participants" DROP CONSTRAINT "schedule_participants_band_member_id_fkey";

-- DropForeignKey
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_band_member_id_fkey";

-- DropForeignKey
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_place_id_fkey";

-- DropForeignKey
ALTER TABLE "songs" DROP CONSTRAINT "songs_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "space_members" DROP CONSTRAINT "space_members_band_member_id_fkey";

-- DropForeignKey
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_band_member_id_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_team_leader_user_id_fkey";

-- AlterTable
ALTER TABLE "band_genres" DROP COLUMN "genres_id",
ADD COLUMN     "genre_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "band_invite_link" DROP COLUMN "create_user_id",
ADD COLUMN     "create_band_member_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "band_members" DROP COLUMN "band_member_id",
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "band_spaces" DROP COLUMN "created_by_user_id",
ADD COLUMN     "created_by_band_member_id" UUID NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "bands" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "visibility" SET NOT NULL;

-- AlterTable
ALTER TABLE "genres" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "title" SET NOT NULL;

-- AlterTable
ALTER TABLE "places" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL;

-- AlterTable
ALTER TABLE "schedules" DROP COLUMN "band_member_id",
ADD COLUMN     "created_by_band_member_id" UUID NOT NULL,
ALTER COLUMN "place_id" DROP NOT NULL,
ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "schedule_type" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PLANNED';

-- AlterTable
ALTER TABLE "skill_types" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "songs" DROP COLUMN "created_by_user_id",
DROP COLUMN "status",
ADD COLUMN     "created_by_band_member_id" UUID,
ALTER COLUMN "band_id" SET NOT NULL,
ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "artist_name" SET NOT NULL;

-- AlterTable
ALTER TABLE "teams" DROP COLUMN "team_leader_user_id",
ADD COLUMN     "team_leader_band_member_id" UUID,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL;

-- AlterTable
ALTER TABLE "user_skills" ALTER COLUMN "is_primary" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "band_blacklists_band_id_user_id_key" ON "band_blacklists"("band_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "band_genres_band_id_genre_id_key" ON "band_genres"("band_id", "genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "band_invitations_band_id_invitee_user_id_key" ON "band_invitations"("band_id", "invitee_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "band_join_requests_band_id_user_id_key" ON "band_join_requests"("band_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "band_members_band_id_user_id_key" ON "band_members"("band_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "band_space_team_band_space_id_team_id_key" ON "band_space_team"("band_space_id", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "favor_genres_user_id_genre_id_key" ON "favor_genres"("user_id", "genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_participants_schedule_id_band_member_id_key" ON "schedule_participants"("schedule_id", "band_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "song_skills_song_id_skill_type_id_key" ON "song_skills"("song_id", "skill_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "space_members_band_space_id_band_member_id_key" ON "space_members"("band_space_id", "band_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_band_member_id_key" ON "team_members"("team_id", "band_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_songs_team_id_song_id_key" ON "team_songs"("team_id", "song_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_user_id_skill_type_id_key" ON "user_skills"("user_id", "skill_type_id");

-- AddForeignKey
ALTER TABLE "band_genres" ADD CONSTRAINT "band_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_invitations" ADD CONSTRAINT "band_invitations_inviter_band_member_id_fkey" FOREIGN KEY ("inviter_band_member_id") REFERENCES "band_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_invite_link" ADD CONSTRAINT "band_invite_link_create_band_member_id_fkey" FOREIGN KEY ("create_band_member_id") REFERENCES "band_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_members" ADD CONSTRAINT "band_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_spaces" ADD CONSTRAINT "band_spaces_created_by_band_member_id_fkey" FOREIGN KEY ("created_by_band_member_id") REFERENCES "band_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_members" ADD CONSTRAINT "space_members_band_member_id_fkey" FOREIGN KEY ("band_member_id") REFERENCES "band_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_created_by_band_member_id_fkey" FOREIGN KEY ("created_by_band_member_id") REFERENCES "band_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_created_by_band_member_id_fkey" FOREIGN KEY ("created_by_band_member_id") REFERENCES "band_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_participants" ADD CONSTRAINT "schedule_participants_band_member_id_fkey" FOREIGN KEY ("band_member_id") REFERENCES "band_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_team_leader_band_member_id_fkey" FOREIGN KEY ("team_leader_band_member_id") REFERENCES "band_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_band_member_id_fkey" FOREIGN KEY ("band_member_id") REFERENCES "band_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
