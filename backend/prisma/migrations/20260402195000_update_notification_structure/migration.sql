ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";

CREATE TYPE "NotificationType" AS ENUM ('INVITE', 'NOTICE', 'REMINDER');

ALTER TABLE "notifications"
ALTER COLUMN "type" TYPE "NotificationType"
USING (
  CASE
    WHEN "type"::text = 'INFO' THEN 'NOTICE'
    WHEN "type"::text = 'WARNING' THEN 'NOTICE'
    ELSE "type"::text
  END
)::"NotificationType";

DROP TYPE "NotificationType_old";

ALTER TABLE "notifications"
ADD COLUMN "description" TEXT,
ADD COLUMN "target_path" TEXT;

CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

CREATE INDEX "notifications_user_id_is_read_type_idx" ON "notifications"("user_id", "is_read", "type");
