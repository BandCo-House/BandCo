-- CreateTable
CREATE TABLE "schedule_polls" (
    "id" UUID NOT NULL,
    "band_space_id" UUID NOT NULL,
    "created_by_band_member_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "schedule_polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_poll_options" (
    "id" UUID NOT NULL,
    "schedule_poll_id" UUID NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_poll_votes" (
    "id" UUID NOT NULL,
    "schedule_poll_option_id" UUID NOT NULL,
    "band_member_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_polls_band_space_id_created_at_idx" ON "schedule_polls"("band_space_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_poll_options_schedule_poll_id_start_at_end_at_key" ON "schedule_poll_options"("schedule_poll_id", "start_at", "end_at");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_poll_votes_schedule_poll_option_id_band_member_id_key" ON "schedule_poll_votes"("schedule_poll_option_id", "band_member_id");

-- CreateIndex
CREATE INDEX "schedule_poll_votes_band_member_id_idx" ON "schedule_poll_votes"("band_member_id");

-- AddForeignKey
ALTER TABLE "schedule_polls" ADD CONSTRAINT "schedule_polls_band_space_id_fkey" FOREIGN KEY ("band_space_id") REFERENCES "band_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_polls" ADD CONSTRAINT "schedule_polls_created_by_band_member_id_fkey" FOREIGN KEY ("created_by_band_member_id") REFERENCES "band_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_poll_options" ADD CONSTRAINT "schedule_poll_options_schedule_poll_id_fkey" FOREIGN KEY ("schedule_poll_id") REFERENCES "schedule_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_poll_votes" ADD CONSTRAINT "schedule_poll_votes_schedule_poll_option_id_fkey" FOREIGN KEY ("schedule_poll_option_id") REFERENCES "schedule_poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_poll_votes" ADD CONSTRAINT "schedule_poll_votes_band_member_id_fkey" FOREIGN KEY ("band_member_id") REFERENCES "band_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
