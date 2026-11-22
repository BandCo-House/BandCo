-- 고유 ID(@handle)가 없는 유저를 없앤다. 서버가 준 랜덤 ID인지 표시하는 컬럼을 추가한다.
ALTER TABLE "user_profiles" ADD COLUMN "handle_generated" BOOLEAN NOT NULL DEFAULT false;

-- 앱은 대소문자를 무시해 하나만 쓰게 하지만 기존 유니크 인덱스는 대소문자를 구분한다. DB에서도 막는다.
-- 백필보다 먼저 만들어 아래 중복 검사가 이 인덱스를 타게 한다.
-- 대소문자만 다른 기존 쌍이 있으면 여기서 실패하므로 배포 전에 확인한다:
--   SELECT lower(handle), count(*) FROM user_profiles WHERE handle IS NOT NULL GROUP BY 1 HAVING count(*) > 1;
-- (Prisma 스키마 문법으로는 식 인덱스를 표현할 수 없어 이 마이그레이션에만 존재한다.
--  이후 migrate dev가 이 인덱스를 지우는 DROP INDEX를 만들면 그 줄을 지운다.)
CREATE UNIQUE INDEX "user_profiles_handle_lower_key" ON "user_profiles" (lower("handle"));

-- 고유 ID가 없는 유저(탈퇴 유저 포함)에게 소문자·숫자 8자 랜덤 ID를 준다. 대소문자 무시로 겹치면 다시 뽑는다.
DO $$
DECLARE
  target RECORD;
  candidate TEXT;
BEGIN
  FOR target IN SELECT "user_id" FROM "user_profiles" WHERE "handle" IS NULL LOOP
    LOOP
      SELECT string_agg(substr('abcdefghijklmnopqrstuvwxyz0123456789', floor(random() * 36)::int + 1, 1), '')
        INTO candidate
        FROM generate_series(1, 8);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "user_profiles" WHERE lower("handle") = candidate);
    END LOOP;

    UPDATE "user_profiles"
      SET "handle" = candidate, "handle_generated" = true, "handle_changed_at" = NULL
      WHERE "user_id" = target."user_id";
  END LOOP;
END $$;
