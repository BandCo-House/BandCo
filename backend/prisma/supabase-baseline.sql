-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BandSpaceMemberRole" AS ENUM ('LEADER', 'MEMBER');

-- CreateEnum
CREATE TYPE "BandSpaceMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SkillLevelType" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SongKey" AS ENUM ('C', 'CM', 'D', 'DM', 'E', 'EM', 'F', 'FM', 'G', 'GM', 'A', 'AM', 'B', 'BM');

-- CreateEnum
CREATE TYPE "BandInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INVITE', 'NOTICE', 'REMINDER');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'ATTENDING', 'ABSENT');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('PRACTICE', 'MEETING');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('PLANNED', 'DONE', 'CANCELED');

-- CreateEnum
CREATE TYPE "BandSpaceType" AS ENUM ('PERFORMANCE', 'PRACTICE', 'ONLINE');

-- CreateEnum
CREATE TYPE "BandSpaceStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BandMemberRole" AS ENUM ('BM', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('LEADER', 'MEMBER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255),
    "password_hash" VARCHAR(255),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(40) NOT NULL,

    CONSTRAINT "skill_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" UUID NOT NULL,
    "name" VARCHAR(20) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "nickname" VARCHAR(255) NOT NULL,
    "self_description" TEXT,
    "profile_music_url" TEXT,
    "avatar_url" TEXT,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "target_path" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "reminds_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "id" UUID NOT NULL,
    "skill_level" "SkillLevelType" NOT NULL DEFAULT 'BEGINNER',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "skill_type_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favor_genres" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "genre_id" UUID NOT NULL,

    CONSTRAINT "favor_genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_genres" (
    "id" UUID NOT NULL,
    "band_id" UUID NOT NULL,
    "genre_id" UUID NOT NULL,

    CONSTRAINT "band_genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bands" (
    "id" UUID NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "bm_id" UUID NOT NULL,
    "description" TEXT,
    "visibility" BOOLEAN NOT NULL DEFAULT true,
    "cover_img_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "bands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_join_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "band_id" UUID NOT NULL,
    "message" TEXT,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "band_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_invitations" (
    "id" UUID NOT NULL,
    "band_id" UUID NOT NULL,
    "inviter_band_member_id" UUID NOT NULL,
    "invitee_user_id" UUID NOT NULL,
    "status" "BandInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "responded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT,

    CONSTRAINT "band_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_invite_link" (
    "id" UUID NOT NULL,
    "band_id" UUID NOT NULL,
    "create_band_member_id" UUID NOT NULL,
    "code" VARCHAR(255),
    "expired_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "band_invite_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_members" (
    "id" UUID NOT NULL,
    "band_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "BandMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "band_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_blacklists" (
    "id" UUID NOT NULL,
    "band_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "band_blacklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" UUID NOT NULL,
    "band_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "detail_address" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "image_url" VARCHAR(255),

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_spaces" (
    "id" UUID NOT NULL,
    "band_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "space_type" "BandSpaceType",
    "status" "BandSpaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "created_by_band_member_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "band_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_members" (
    "id" UUID NOT NULL,
    "band_space_id" UUID NOT NULL,
    "band_member_id" UUID NOT NULL,
    "role" "BandSpaceMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "BandSpaceMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "space_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" UUID NOT NULL,
    "band_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "artist_name" VARCHAR(200) NOT NULL,
    "key" "SongKey",
    "bpm" SMALLINT,
    "source_url" TEXT,
    "source_type" VARCHAR(20),
    "memo" TEXT,
    "difficulty_level" SMALLINT,
    "created_by_band_member_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_skills" (
    "id" UUID NOT NULL,
    "song_id" UUID NOT NULL,
    "skill_type_id" UUID NOT NULL,

    CONSTRAINT "song_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" UUID NOT NULL,
    "band_space_id" UUID NOT NULL,
    "place_id" UUID,
    "title" VARCHAR(150) NOT NULL,
    "schedule_type" "ScheduleType" NOT NULL,
    "start_at" TIMESTAMPTZ(6),
    "end_at" TIMESTAMPTZ(6),
    "memo" TEXT,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'PLANNED',
    "created_by_band_member_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_participants" (
    "id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "band_member_id" UUID NOT NULL,
    "attendance_status" "AttendanceStatus",
    "note" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "schedule_participants_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "band_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "status" "TeamStatus" NOT NULL DEFAULT 'ACTIVE',
    "team_leader_band_member_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "team_cover_url" VARCHAR(255),

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "band_member_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "team_role" "TeamMemberRole" NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_songs" (
    "id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "song_id" UUID NOT NULL,

    CONSTRAINT "team_songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_space_team" (
    "id" UUID NOT NULL,
    "band_space_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,

    CONSTRAINT "band_space_team_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_type_idx" ON "notifications"("user_id", "is_read", "type");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_user_id_skill_type_id_key" ON "user_skills"("user_id", "skill_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "favor_genres_user_id_genre_id_key" ON "favor_genres"("user_id", "genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "band_genres_band_id_genre_id_key" ON "band_genres"("band_id", "genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "band_join_requests_band_id_user_id_key" ON "band_join_requests"("band_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "band_invitations_band_id_invitee_user_id_key" ON "band_invitations"("band_id", "invitee_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "band_members_band_id_user_id_key" ON "band_members"("band_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "band_blacklists_band_id_user_id_key" ON "band_blacklists"("band_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "space_members_band_space_id_band_member_id_key" ON "space_members"("band_space_id", "band_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "song_skills_song_id_skill_type_id_key" ON "song_skills"("song_id", "skill_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_participants_schedule_id_band_member_id_key" ON "schedule_participants"("schedule_id", "band_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_band_member_id_key" ON "team_members"("team_id", "band_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_songs_team_id_song_id_key" ON "team_songs"("team_id", "song_id");

-- CreateIndex
CREATE UNIQUE INDEX "band_space_team_band_space_id_team_id_key" ON "band_space_team"("band_space_id", "team_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skill_type_id_fkey" FOREIGN KEY ("skill_type_id") REFERENCES "skill_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favor_genres" ADD CONSTRAINT "favor_genres_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favor_genres" ADD CONSTRAINT "favor_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_genres" ADD CONSTRAINT "band_genres_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "bands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_genres" ADD CONSTRAINT "band_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bands" ADD CONSTRAINT "bands_bm_id_fkey" FOREIGN KEY ("bm_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_join_requests" ADD CONSTRAINT "band_join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_join_requests" ADD CONSTRAINT "band_join_requests_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "bands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_invitations" ADD CONSTRAINT "band_invitations_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "bands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_invitations" ADD CONSTRAINT "band_invitations_inviter_band_member_id_fkey" FOREIGN KEY ("inviter_band_member_id") REFERENCES "band_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_invitations" ADD CONSTRAINT "band_invitations_invitee_user_id_fkey" FOREIGN KEY ("invitee_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_invite_link" ADD CONSTRAINT "band_invite_link_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "bands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_invite_link" ADD CONSTRAINT "band_invite_link_create_band_member_id_fkey" FOREIGN KEY ("create_band_member_id") REFERENCES "band_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_members" ADD CONSTRAINT "band_members_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "bands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_members" ADD CONSTRAINT "band_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_blacklists" ADD CONSTRAINT "band_blacklists_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "bands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_blacklists" ADD CONSTRAINT "band_blacklists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "bands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_spaces" ADD CONSTRAINT "band_spaces_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "bands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_spaces" ADD CONSTRAINT "band_spaces_created_by_band_member_id_fkey" FOREIGN KEY ("created_by_band_member_id") REFERENCES "band_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_members" ADD CONSTRAINT "space_members_band_space_id_fkey" FOREIGN KEY ("band_space_id") REFERENCES "band_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_members" ADD CONSTRAINT "space_members_band_member_id_fkey" FOREIGN KEY ("band_member_id") REFERENCES "band_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "bands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_created_by_band_member_id_fkey" FOREIGN KEY ("created_by_band_member_id") REFERENCES "band_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_skills" ADD CONSTRAINT "song_skills_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_skills" ADD CONSTRAINT "song_skills_skill_type_id_fkey" FOREIGN KEY ("skill_type_id") REFERENCES "skill_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_band_space_id_fkey" FOREIGN KEY ("band_space_id") REFERENCES "band_spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_created_by_band_member_id_fkey" FOREIGN KEY ("created_by_band_member_id") REFERENCES "band_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_participants" ADD CONSTRAINT "schedule_participants_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_participants" ADD CONSTRAINT "schedule_participants_band_member_id_fkey" FOREIGN KEY ("band_member_id") REFERENCES "band_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_team" ADD CONSTRAINT "schedule_team_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_team" ADD CONSTRAINT "schedule_team_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_song" ADD CONSTRAINT "schedule_song_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_song" ADD CONSTRAINT "schedule_song_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "bands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_team_leader_band_member_id_fkey" FOREIGN KEY ("team_leader_band_member_id") REFERENCES "band_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_band_member_id_fkey" FOREIGN KEY ("band_member_id") REFERENCES "band_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_songs" ADD CONSTRAINT "team_songs_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_songs" ADD CONSTRAINT "team_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_space_team" ADD CONSTRAINT "band_space_team_band_space_id_fkey" FOREIGN KEY ("band_space_id") REFERENCES "band_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_space_team" ADD CONSTRAINT "band_space_team_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

