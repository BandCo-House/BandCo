-- 유저 고유 ID(@handle)와 쿨다운 기준 시각을 프로필에 추가한다.
-- 기존 유저는 null로 두고 본인이 마이페이지에서 설정한다. 유니크 인덱스는 NULL을 여러 개 허용한다.
ALTER TABLE "user_profiles" ADD COLUMN "handle" VARCHAR(8);
ALTER TABLE "user_profiles" ADD COLUMN "handle_changed_at" TIMESTAMPTZ(6);
CREATE UNIQUE INDEX "user_profiles_handle_key" ON "user_profiles"("handle");

-- 닉네임을 20자로 제한한다. 20자를 넘는 기존 닉네임은 앞 20자만 남긴다.
UPDATE "user_profiles" SET "nickname" = left("nickname", 20) WHERE char_length("nickname") > 20;
ALTER TABLE "user_profiles" ALTER COLUMN "nickname" TYPE VARCHAR(20);
