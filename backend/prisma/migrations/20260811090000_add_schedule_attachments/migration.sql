-- AlterTable
ALTER TABLE "schedules"
ADD COLUMN "external_links" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "schedule_reference_files" (
    "id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_reference_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "schedule_reference_files"
ADD CONSTRAINT "schedule_reference_files_schedule_id_fkey"
FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
