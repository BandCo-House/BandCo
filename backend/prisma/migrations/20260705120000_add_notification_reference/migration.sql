-- CreateEnum
CREATE TYPE "NotificationReferenceType" AS ENUM ('BAND_INVITATION');

-- AlterTable
ALTER TABLE "notifications"
ADD COLUMN "reference_type" "NotificationReferenceType",
ADD COLUMN "reference_id" UUID;
