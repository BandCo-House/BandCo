CREATE OR REPLACE FUNCTION exp_uuid(input_text text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (
    substr(md5(input_text), 1, 8) || '-' ||
    substr(md5(input_text), 9, 4) || '-' ||
    substr(md5(input_text), 13, 4) || '-' ||
    substr(md5(input_text), 17, 4) || '-' ||
    substr(md5(input_text), 21, 12)
  )::uuid
$$;

INSERT INTO users (id, email, status, created_at, updated_at)
SELECT
  exp_uuid('target-user-' || member_no),
  'target' || member_no || '@example.com',
  'ACTIVE',
  timestamptz '2026-01-01 00:00:00+09' + member_no * interval '1 day',
  timestamptz '2026-01-01 00:00:00+09' + member_no * interval '1 day'
FROM generate_series(1, 30) AS member_no;

INSERT INTO users (id, email, status, created_at, updated_at)
SELECT
  exp_uuid('comparison-user-' || member_no),
  'comparison' || member_no || '@example.com',
  'ACTIVE',
  timestamptz '2026-01-01 00:00:00+09' + member_no * interval '1 day',
  timestamptz '2026-01-01 00:00:00+09' + member_no * interval '1 day'
FROM generate_series(1, 30) AS member_no;

INSERT INTO user_profiles (user_id, nickname, self_description, updated_at)
SELECT
  exp_uuid('target-user-' || member_no),
  CASE member_no
    WHEN 1 THEN '김민수'
    WHEN 2 THEN '이서연'
    WHEN 3 THEN '박지훈'
    WHEN 4 THEN '최유진'
    WHEN 5 THEN '정하늘'
    ELSE '멤버' || lpad(member_no::text, 2, '0')
  END,
  CASE WHEN member_no % 3 = 0 THEN NULL ELSE '자기소개 ' || member_no END,
  timestamptz '2026-08-01 00:00:00+09'
FROM generate_series(1, 30) AS member_no;

INSERT INTO user_profiles (user_id, nickname, self_description, updated_at)
SELECT
  exp_uuid('comparison-user-' || member_no),
  CASE member_no
    WHEN 1 THEN '김민수'
    WHEN 2 THEN '이서연'
    WHEN 3 THEN '박지훈'
    WHEN 4 THEN '최유진'
    WHEN 5 THEN '정하늘'
    ELSE '비교멤버' || lpad(member_no::text, 2, '0')
  END,
  '다른 밴드 사용자',
  timestamptz '2026-08-01 00:00:00+09'
FROM generate_series(1, 30) AS member_no;

INSERT INTO bands (id, name, bm_id, description, visibility, created_at, updated_at)
VALUES
  ('11111111-1111-4111-8111-111111111111', '실험 밴드', exp_uuid('target-user-1'), 'Text-to-SQL 정확도 실험 밴드', true, timestamptz '2026-01-01 00:00:00+09', timestamptz '2026-08-01 00:00:00+09'),
  ('22222222-2222-4222-8222-222222222222', '비교 밴드', exp_uuid('comparison-user-1'), '범위 누출 확인 밴드', true, timestamptz '2026-01-01 00:00:00+09', timestamptz '2026-08-01 00:00:00+09');

INSERT INTO band_members (id, band_id, user_id, role, joined_at)
SELECT
  exp_uuid('target-member-' || member_no),
  '11111111-1111-4111-8111-111111111111',
  exp_uuid('target-user-' || member_no),
  CASE WHEN member_no = 1 THEN 'BM' WHEN member_no IN (2, 3) THEN 'ADMIN' ELSE 'MEMBER' END::"BandMemberRole",
  timestamptz '2026-01-01 00:00:00+09' + member_no * interval '1 day'
FROM generate_series(1, 30) AS member_no;

INSERT INTO band_members (id, band_id, user_id, role, joined_at)
SELECT
  exp_uuid('comparison-member-' || member_no),
  '22222222-2222-4222-8222-222222222222',
  exp_uuid('comparison-user-' || member_no),
  CASE WHEN member_no = 1 THEN 'BM' ELSE 'MEMBER' END::"BandMemberRole",
  timestamptz '2026-01-01 00:00:00+09' + member_no * interval '1 day'
FROM generate_series(1, 30) AS member_no;

INSERT INTO skill_types (id, name)
VALUES
  (exp_uuid('skill-guitar'), '기타'),
  (exp_uuid('skill-bass'), '베이스'),
  (exp_uuid('skill-vocal'), '보컬'),
  (exp_uuid('skill-drums'), '드럼'),
  (exp_uuid('skill-keyboard'), '키보드');

INSERT INTO genres (id, name)
VALUES
  (exp_uuid('genre-rock'), '록'),
  (exp_uuid('genre-jazz'), '재즈'),
  (exp_uuid('genre-pop'), '팝'),
  (exp_uuid('genre-metal'), '메탈');

INSERT INTO user_skills (id, skill_level, is_primary, created_at, skill_type_id, user_id)
SELECT
  exp_uuid('target-user-skill-' || member_no),
  CASE member_no % 3 WHEN 0 THEN 'ADVANCED' WHEN 1 THEN 'BEGINNER' ELSE 'INTERMEDIATE' END::"SkillLevelType",
  true,
  timestamptz '2026-02-01 00:00:00+09',
  CASE member_no % 5
    WHEN 0 THEN exp_uuid('skill-guitar')
    WHEN 1 THEN exp_uuid('skill-bass')
    WHEN 2 THEN exp_uuid('skill-vocal')
    WHEN 3 THEN exp_uuid('skill-drums')
    ELSE exp_uuid('skill-keyboard')
  END,
  exp_uuid('target-user-' || member_no)
FROM generate_series(1, 30) AS member_no;

INSERT INTO user_skills (id, skill_level, is_primary, created_at, skill_type_id, user_id)
SELECT
  exp_uuid('target-secondary-skill-' || member_no),
  'INTERMEDIATE',
  false,
  timestamptz '2026-03-01 00:00:00+09',
  exp_uuid('skill-vocal'),
  exp_uuid('target-user-' || member_no)
FROM generate_series(5, 30, 5) AS member_no
ON CONFLICT (user_id, skill_type_id) DO NOTHING;

INSERT INTO favor_genres (id, user_id, genre_id)
SELECT
  exp_uuid('target-favorite-' || member_no),
  exp_uuid('target-user-' || member_no),
  CASE member_no % 4
    WHEN 0 THEN exp_uuid('genre-rock')
    WHEN 1 THEN exp_uuid('genre-jazz')
    WHEN 2 THEN exp_uuid('genre-pop')
    ELSE exp_uuid('genre-metal')
  END
FROM generate_series(1, 30) AS member_no;

INSERT INTO band_spaces (id, band_id, name, description, space_type, status, start_date, created_by_band_member_id, created_at, updated_at)
VALUES
  (exp_uuid('target-space-1'), '11111111-1111-4111-8111-111111111111', '메인 합주실', '정기 합주 공간', 'PRACTICE', 'ACTIVE', timestamptz '2026-01-01 00:00:00+09', exp_uuid('target-member-1'), timestamptz '2026-01-01 00:00:00+09', timestamptz '2026-08-01 00:00:00+09'),
  (exp_uuid('target-space-2'), '11111111-1111-4111-8111-111111111111', '온라인 회의실', '회의 공간', 'ONLINE', 'ACTIVE', timestamptz '2026-02-01 00:00:00+09', exp_uuid('target-member-1'), timestamptz '2026-02-01 00:00:00+09', timestamptz '2026-08-01 00:00:00+09'),
  (exp_uuid('target-space-3'), '11111111-1111-4111-8111-111111111111', '공연 준비실', '비활성 공간', 'PERFORMANCE', 'INACTIVE', timestamptz '2026-03-01 00:00:00+09', exp_uuid('target-member-1'), timestamptz '2026-03-01 00:00:00+09', timestamptz '2026-08-01 00:00:00+09'),
  (exp_uuid('comparison-space-1'), '22222222-2222-4222-8222-222222222222', '메인 합주실', '다른 밴드 공간', 'PRACTICE', 'ACTIVE', timestamptz '2026-01-01 00:00:00+09', exp_uuid('comparison-member-1'), timestamptz '2026-01-01 00:00:00+09', timestamptz '2026-08-01 00:00:00+09');

INSERT INTO places (id, band_id, name, address, detail_address, is_active, created_at, updated_at)
SELECT
  exp_uuid('target-place-' || place_no),
  '11111111-1111-4111-8111-111111111111',
  (ARRAY['강남 합주실', '홍대 연습실', '성수 스튜디오', '잠실 공연장', '폐쇄 장소'])[place_no],
  '서울시 실험구 ' || place_no,
  place_no || '층',
  place_no < 5,
  timestamptz '2026-01-01 00:00:00+09',
  timestamptz '2026-08-01 00:00:00+09'
FROM generate_series(1, 5) AS place_no;

INSERT INTO schedules (id, band_space_id, place_id, title, schedule_type, start_at, end_at, status, created_by_band_member_id, created_at, updated_at)
SELECT
  exp_uuid('target-schedule-' || schedule_no),
  exp_uuid('target-space-' || (((schedule_no - 1) % 3) + 1)),
  exp_uuid('target-place-' || (((schedule_no - 1) % 5) + 1)),
  CASE WHEN schedule_no % 5 = 0 THEN '정기 회의 ' ELSE '정기 합주 ' END || lpad(schedule_no::text, 3, '0'),
  CASE WHEN schedule_no % 5 = 0 THEN 'MEETING' ELSE 'PRACTICE' END::"ScheduleType",
  timestamptz '2026-07-01 19:00:00+09' + (schedule_no - 1) * interval '1 day',
  timestamptz '2026-07-01 21:00:00+09' + (schedule_no - 1) * interval '1 day',
  CASE
    WHEN schedule_no % 13 = 0 THEN 'CANCELED'
    WHEN timestamptz '2026-07-01 19:00:00+09' + (schedule_no - 1) * interval '1 day' < timestamptz '2026-09-01 00:00:00+00' THEN 'DONE'
    ELSE 'PLANNED'
  END::"ScheduleStatus",
  exp_uuid('target-member-1'),
  timestamptz '2026-06-01 00:00:00+09' + schedule_no * interval '1 hour',
  timestamptz '2026-06-01 00:00:00+09' + schedule_no * interval '1 hour'
FROM generate_series(1, 120) AS schedule_no;

INSERT INTO schedules (id, band_space_id, place_id, title, schedule_type, start_at, end_at, status, created_by_band_member_id, created_at, updated_at)
SELECT
  exp_uuid('comparison-schedule-' || schedule_no),
  exp_uuid('comparison-space-1'),
  NULL,
  '비교 밴드 일정 ' || schedule_no,
  'PRACTICE',
  timestamptz '2026-07-01 19:00:00+09' + (schedule_no - 1) * interval '1 day',
  timestamptz '2026-07-01 21:00:00+09' + (schedule_no - 1) * interval '1 day',
  CASE WHEN schedule_no < 63 THEN 'DONE' ELSE 'PLANNED' END::"ScheduleStatus",
  exp_uuid('comparison-member-1'),
  timestamptz '2026-06-01 00:00:00+09',
  timestamptz '2026-06-01 00:00:00+09'
FROM generate_series(1, 120) AS schedule_no;

INSERT INTO schedule_participants (id, schedule_id, band_member_id, attendance_status, updated_at)
SELECT
  exp_uuid('target-participant-' || schedule_no || '-' || member_no),
  exp_uuid('target-schedule-' || schedule_no),
  exp_uuid('target-member-' || member_no),
  CASE
    WHEN (schedule_no + member_no) % 17 = 0 THEN NULL
    WHEN (schedule_no + member_no) % 4 = 0 THEN 'PENDING'
    WHEN (schedule_no + member_no) % 4 IN (1, 2) THEN 'ATTENDING'
    ELSE 'ABSENT'
  END::"AttendanceStatus",
  timestamptz '2026-06-01 00:00:00+09' + schedule_no * interval '1 day'
FROM generate_series(1, 120) AS schedule_no
CROSS JOIN generate_series(1, 30) AS member_no;

INSERT INTO songs (id, band_id, title, artist_name, key, bpm, difficulty_level, song_length, created_by_band_member_id, created_at, updated_at)
SELECT
  exp_uuid('target-song-' || song_no),
  '11111111-1111-4111-8111-111111111111',
  CASE song_no WHEN 1 THEN '알파' WHEN 2 THEN '베타' WHEN 3 THEN '감마' ELSE '실험곡 ' || lpad(song_no::text, 2, '0') END,
  '아티스트 ' || chr(65 + ((song_no - 1) % 4)),
  (ARRAY['C', 'G', 'A', 'DM', 'EM'])[((song_no - 1) % 5) + 1]::"SongKey",
  80 + (song_no % 101),
  1 + (song_no % 5),
  180 + song_no,
  exp_uuid('target-member-1'),
  timestamptz '2026-01-01 00:00:00+09' + song_no * interval '1 day',
  timestamptz '2026-01-01 00:00:00+09' + song_no * interval '1 day'
FROM generate_series(1, 80) AS song_no;

INSERT INTO songs (id, band_id, title, artist_name, key, bpm, difficulty_level, song_length, created_by_band_member_id, created_at, updated_at)
SELECT
  exp_uuid('comparison-song-' || song_no),
  '22222222-2222-4222-8222-222222222222',
  CASE song_no WHEN 1 THEN '알파' ELSE '비교곡 ' || song_no END,
  '아티스트 A',
  'C',
  120,
  3,
  240,
  exp_uuid('comparison-member-1'),
  timestamptz '2026-01-01 00:00:00+09' + song_no * interval '1 day',
  timestamptz '2026-01-01 00:00:00+09' + song_no * interval '1 day'
FROM generate_series(1, 80) AS song_no;

INSERT INTO song_skills (id, song_id, skill_type_id)
SELECT
  exp_uuid('target-song-skill-' || song_no),
  exp_uuid('target-song-' || song_no),
  CASE song_no % 5
    WHEN 0 THEN exp_uuid('skill-guitar')
    WHEN 1 THEN exp_uuid('skill-bass')
    WHEN 2 THEN exp_uuid('skill-vocal')
    WHEN 3 THEN exp_uuid('skill-drums')
    ELSE exp_uuid('skill-keyboard')
  END
FROM generate_series(1, 80) AS song_no;

INSERT INTO schedule_song (id, schedule_id, song_id)
SELECT
  exp_uuid('target-schedule-song-' || schedule_no || '-' || offset_no),
  exp_uuid('target-schedule-' || schedule_no),
  exp_uuid('target-song-' || (((schedule_no * 3 + offset_no - 1) % 80) + 1))
FROM generate_series(1, 120) AS schedule_no
CROSS JOIN generate_series(1, 3) AS offset_no;

INSERT INTO teams (id, band_id, name, description, status, team_leader_band_member_id, created_at, updated_at)
SELECT
  exp_uuid('target-team-' || team_no),
  '11111111-1111-4111-8111-111111111111',
  (ARRAY['보컬팀', '리듬팀', '기타팀', '공연팀', '휴면팀'])[team_no],
  '실험 팀 ' || team_no,
  CASE WHEN team_no = 5 THEN 'INACTIVE' ELSE 'ACTIVE' END::"TeamStatus",
  exp_uuid('target-member-' || team_no),
  timestamptz '2026-02-01 00:00:00+09' + team_no * interval '1 day',
  timestamptz '2026-08-01 00:00:00+09'
FROM generate_series(1, 5) AS team_no;

INSERT INTO team_members (id, team_id, band_member_id, joined_at, team_role)
SELECT
  exp_uuid('target-team-member-' || team_no || '-' || member_offset),
  exp_uuid('target-team-' || team_no),
  exp_uuid('target-member-' || (((team_no - 1) * 6 + member_offset - 1) % 30 + 1)),
  timestamptz '2026-03-01 00:00:00+09' + member_offset * interval '1 day',
  CASE WHEN member_offset = 1 THEN 'LEADER' ELSE 'MEMBER' END::"TeamMemberRole"
FROM generate_series(1, 5) AS team_no
CROSS JOIN generate_series(1, 6) AS member_offset;

INSERT INTO team_songs (id, team_id, song_id)
SELECT
  exp_uuid('target-team-song-' || team_no || '-' || song_offset),
  exp_uuid('target-team-' || team_no),
  exp_uuid('target-song-' || ((team_no - 1) * 4 + song_offset))
FROM generate_series(1, 5) AS team_no
CROSS JOIN generate_series(1, 4) AS song_offset;

ANALYZE;
