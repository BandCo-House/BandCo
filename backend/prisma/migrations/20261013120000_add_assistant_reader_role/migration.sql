-- 자연어 조회가 실행하는 모델 SQL 전용 DB 역할.
-- 앱 검증기에 구멍이 있어도 DB가 컬럼(카탈로그 컬럼만 SELECT 권한)과 행(app.band_id 밴드만, RLS)을 한 번 더 제한한다.
-- 앱은 읽기 전용 트랜잭션 안에서 SET LOCAL ROLE assistant_reader로 바꾸고 set_config('app.band_id', ..., true)를 건 뒤 실행한다.
-- 정책은 assistant_reader에만 걸리므로 테이블 소유자인 앱 계정의 다른 조회에는 영향이 없다.

-- RLS는 테이블 소유자·superuser·BYPASSRLS 역할에는 적용되지 않는다.
-- 앱 계정이 소유자가 아니면 RLS를 켜는 순간 앱의 모든 조회가 막히므로, 그 경우 마이그레이션을 실패시킨다.
DO $$
DECLARE
  target text;
  owner_name name;
BEGIN
  IF (SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN
    RETURN;
  END IF;

  FOREACH target IN ARRAY ARRAY[
    'bands', 'band_members', 'users', 'user_profiles', 'user_skills', 'skill_types', 'favor_genres', 'genres', 'band_spaces',
    'places', 'schedules', 'schedule_participants', 'songs', 'song_skills', 'schedule_song', 'teams', 'team_members', 'team_songs'
  ] LOOP
    SELECT tableowner INTO owner_name FROM pg_tables WHERE schemaname = 'public' AND tablename = target;
    IF owner_name IS DISTINCT FROM current_user THEN
      RAISE EXCEPTION '테이블 %의 소유자(%)가 마이그레이션 계정(%)과 달라 RLS를 켜면 앱 조회가 막힙니다.', target, owner_name, current_user;
    END IF;
  END LOOP;
END
$$;

-- 역할은 클러스터 단위라 이미 있으면 다시 만들지 않는다. 로그인할 수 없고 앱 계정이 SET ROLE로만 쓴다.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'assistant_reader') THEN
    CREATE ROLE assistant_reader NOLOGIN NOINHERIT NOBYPASSRLS;
  END IF;
END
$$;

GRANT assistant_reader TO CURRENT_USER;
GRANT USAGE ON SCHEMA public TO assistant_reader;

-- 설정이 없거나 비어 있으면 NULL이 되어 어떤 밴드 행도 보이지 않는다.
CREATE OR REPLACE FUNCTION assistant_band_id() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT NULLIF(current_setting('app.band_id', true), '')::uuid $$;

-- 컬럼 권한은 backend/src/modules/assistant/sql/sql-catalog.ts의 허용 컬럼과 같아야 한다(sql-catalog.spec.ts가 대조한다).
GRANT SELECT (id, name, description, visibility, created_at, updated_at, deleted_at) ON bands TO assistant_reader;
GRANT SELECT (id, band_id, user_id, role, joined_at) ON band_members TO assistant_reader;
GRANT SELECT (id, status, created_at, deleted_at) ON users TO assistant_reader;
GRANT SELECT (user_id, nickname, self_description, updated_at) ON user_profiles TO assistant_reader;
GRANT SELECT (id, user_id, skill_type_id, skill_level, is_primary, created_at) ON user_skills TO assistant_reader;
GRANT SELECT (id, name) ON skill_types TO assistant_reader;
GRANT SELECT (id, user_id, genre_id) ON favor_genres TO assistant_reader;
GRANT SELECT (id, name) ON genres TO assistant_reader;
GRANT SELECT (id, band_id, name, description, space_type, status, start_date, end_date, created_by_band_member_id, created_at, deleted_at) ON band_spaces TO assistant_reader;
GRANT SELECT (id, band_id, name, address, detail_address, is_active, created_at, updated_at) ON places TO assistant_reader;
GRANT SELECT (id, band_space_id, place_id, title, schedule_type, start_at, end_at, status, created_by_band_member_id, created_at, updated_at) ON schedules TO assistant_reader;
GRANT SELECT (id, schedule_id, band_member_id, attendance_status, updated_at) ON schedule_participants TO assistant_reader;
GRANT SELECT (id, band_id, title, artist_name, key, bpm, difficulty_level, song_length, created_by_band_member_id, created_at, updated_at) ON songs TO assistant_reader;
GRANT SELECT (id, song_id, skill_type_id) ON song_skills TO assistant_reader;
GRANT SELECT (id, schedule_id, song_id) ON schedule_song TO assistant_reader;
GRANT SELECT (id, band_id, name, description, status, team_leader_band_member_id, created_at, updated_at) ON teams TO assistant_reader;
GRANT SELECT (id, team_id, band_member_id, joined_at, team_role) ON team_members TO assistant_reader;
GRANT SELECT (id, team_id, song_id) ON team_songs TO assistant_reader;

ALTER TABLE bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE favor_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_song ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_songs ENABLE ROW LEVEL SECURITY;

-- 밴드에 직접 속한 테이블은 band_id로, 그 아래 테이블은 밴드 소속 부모를 거쳐 판단한다.
CREATE POLICY assistant_band_scope ON bands FOR SELECT TO assistant_reader USING (id = assistant_band_id());
CREATE POLICY assistant_band_scope ON band_members FOR SELECT TO assistant_reader USING (band_id = assistant_band_id());
CREATE POLICY assistant_band_scope ON band_spaces FOR SELECT TO assistant_reader USING (band_id = assistant_band_id());
CREATE POLICY assistant_band_scope ON places FOR SELECT TO assistant_reader USING (band_id = assistant_band_id());
CREATE POLICY assistant_band_scope ON songs FOR SELECT TO assistant_reader USING (band_id = assistant_band_id());
CREATE POLICY assistant_band_scope ON teams FOR SELECT TO assistant_reader USING (band_id = assistant_band_id());

CREATE POLICY assistant_band_scope ON schedules FOR SELECT TO assistant_reader
  USING (band_space_id IN (SELECT bs.id FROM band_spaces bs WHERE bs.band_id = assistant_band_id()));
CREATE POLICY assistant_band_scope ON schedule_participants FOR SELECT TO assistant_reader
  USING (schedule_id IN (SELECT sc.id FROM schedules sc JOIN band_spaces bs ON bs.id = sc.band_space_id WHERE bs.band_id = assistant_band_id()));
CREATE POLICY assistant_band_scope ON schedule_song FOR SELECT TO assistant_reader
  USING (schedule_id IN (SELECT sc.id FROM schedules sc JOIN band_spaces bs ON bs.id = sc.band_space_id WHERE bs.band_id = assistant_band_id()));
CREATE POLICY assistant_band_scope ON song_skills FOR SELECT TO assistant_reader
  USING (song_id IN (SELECT so.id FROM songs so WHERE so.band_id = assistant_band_id()));
CREATE POLICY assistant_band_scope ON team_members FOR SELECT TO assistant_reader
  USING (team_id IN (SELECT t.id FROM teams t WHERE t.band_id = assistant_band_id()));
CREATE POLICY assistant_band_scope ON team_songs FOR SELECT TO assistant_reader
  USING (team_id IN (SELECT t.id FROM teams t WHERE t.band_id = assistant_band_id()));

-- 사용자 정보는 이 밴드의 멤버인 사용자만 보인다.
CREATE POLICY assistant_band_scope ON users FOR SELECT TO assistant_reader
  USING (id IN (SELECT bm.user_id FROM band_members bm WHERE bm.band_id = assistant_band_id()));
CREATE POLICY assistant_band_scope ON user_profiles FOR SELECT TO assistant_reader
  USING (user_id IN (SELECT bm.user_id FROM band_members bm WHERE bm.band_id = assistant_band_id()));
CREATE POLICY assistant_band_scope ON user_skills FOR SELECT TO assistant_reader
  USING (user_id IN (SELECT bm.user_id FROM band_members bm WHERE bm.band_id = assistant_band_id()));
CREATE POLICY assistant_band_scope ON favor_genres FOR SELECT TO assistant_reader
  USING (user_id IN (SELECT bm.user_id FROM band_members bm WHERE bm.band_id = assistant_band_id()));

-- 세션 종류·장르는 밴드와 무관한 공용 목록이다.
CREATE POLICY assistant_band_scope ON skill_types FOR SELECT TO assistant_reader USING (true);
CREATE POLICY assistant_band_scope ON genres FOR SELECT TO assistant_reader USING (true);
