export interface SqlCatalogTable {
  alias: string;
  description: string;
  columns: Record<string, string>;
}

export interface SqlCatalogJoin {
  left: string;
  right: string;
}

/**
 * 프롬프트와 AST 검증기가 함께 사용하는 SQL 허용 목록이다.
 * 인증정보, 메모, URL은 자연어 조회에 필요하지 않아 의도적으로 제외한다.
 */
export const SQL_CATALOG: Record<string, SqlCatalogTable> = {
  bands: {
    alias: 'b',
    description: '밴드',
    columns: {
      id: '밴드 ID',
      name: '밴드 이름',
      description: '밴드 설명',
      visibility: '공개 여부',
      created_at: '생성 시각',
      updated_at: '수정 시각',
      deleted_at: '삭제 시각',
    },
  },
  band_members: {
    alias: 'bm',
    description: '밴드 멤버',
    columns: {
      id: '밴드 멤버 ID',
      band_id: '밴드 ID',
      user_id: '사용자 ID',
      role: 'BM, ADMIN, MEMBER 중 밴드 역할',
      joined_at: '밴드 가입 시각',
    },
  },
  users: {
    alias: 'u',
    description: '사용자. 인증정보는 조회할 수 없음',
    columns: {
      id: '사용자 ID',
      status: 'ACTIVE 또는 INACTIVE',
      created_at: '가입 시각',
      deleted_at: '탈퇴 시각',
    },
  },
  user_profiles: {
    alias: 'up',
    description: '사용자 공개 프로필',
    columns: {
      user_id: '사용자 ID',
      nickname: '닉네임',
      self_description: '자기소개',
      updated_at: '수정 시각',
    },
  },
  user_skills: {
    alias: 'us',
    description: '사용자 악기·기술',
    columns: {
      id: '사용자 기술 ID',
      user_id: '사용자 ID',
      skill_type_id: '기술 종류 ID',
      skill_level: 'BEGINNER, INTERMEDIATE, ADVANCED 중 숙련도',
      is_primary: '주 기술 여부',
      created_at: '등록 시각',
    },
  },
  skill_types: {
    alias: 'st',
    description: '악기·기술 종류',
    columns: {
      id: '기술 종류 ID',
      name: '기술 이름',
    },
  },
  favorite_genres: {
    alias: 'fg',
    description: '사용자 선호 장르',
    columns: {
      id: '선호 장르 ID',
      user_id: '사용자 ID',
      genre_id: '장르 ID',
    },
  },
  genres: {
    alias: 'g',
    description: '음악 장르',
    columns: {
      id: '장르 ID',
      name: '장르 이름',
    },
  },
  band_spaces: {
    alias: 'bs',
    description: '밴드 활동 공간',
    columns: {
      id: '공간 ID',
      band_id: '밴드 ID',
      name: '공간 이름',
      description: '공간 설명',
      space_type: 'PERFORMANCE, PRACTICE, ONLINE 중 공간 종류',
      status: 'ACTIVE 또는 INACTIVE',
      start_date: '시작 시각',
      end_date: '종료 시각',
      created_by_band_member_id: '생성한 밴드 멤버 ID',
      created_at: '생성 시각',
      deleted_at: '삭제 시각',
    },
  },
  places: {
    alias: 'p',
    description: '밴드가 등록한 장소',
    columns: {
      id: '장소 ID',
      band_id: '밴드 ID',
      name: '장소 이름',
      address: '주소',
      detail_address: '상세 주소',
      is_active: '사용 여부',
      created_at: '생성 시각',
      updated_at: '수정 시각',
    },
  },
  schedules: {
    alias: 'sc',
    description: '밴드 일정',
    columns: {
      id: '일정 ID',
      band_space_id: '밴드 공간 ID',
      place_id: '장소 ID',
      title: '일정 제목',
      schedule_type: 'PRACTICE 또는 MEETING',
      start_at: '시작 시각',
      end_at: '종료 시각',
      status: 'PLANNED, DONE, CANCELED 중 상태',
      created_by_band_member_id: '생성한 밴드 멤버 ID',
      created_at: '생성 시각',
      updated_at: '수정 시각',
    },
  },
  schedule_participants: {
    alias: 'sp',
    description: '일정 참석 대상과 응답',
    columns: {
      id: '참석 응답 ID',
      schedule_id: '일정 ID',
      band_member_id: '밴드 멤버 ID',
      attendance_status: 'PENDING, ATTENDING, ABSENT 또는 NULL',
      updated_at: '응답 시각',
    },
  },
  songs: {
    alias: 'so',
    description: '밴드 곡',
    columns: {
      id: '곡 ID',
      band_id: '밴드 ID',
      title: '곡 제목',
      artist_name: '아티스트 이름',
      key: '조성',
      bpm: 'BPM',
      difficulty_level: '난이도',
      song_length: '재생 길이(초)',
      created_by_band_member_id: '등록한 밴드 멤버 ID',
      created_at: '등록 시각',
      updated_at: '수정 시각',
    },
  },
  song_skills: {
    alias: 'ssk',
    description: '곡에 필요한 악기·기술',
    columns: {
      id: '곡 기술 ID',
      song_id: '곡 ID',
      skill_type_id: '기술 종류 ID',
    },
  },
  schedule_song: {
    alias: 'sso',
    description: '일정에 편성된 곡',
    columns: {
      id: '일정 곡 ID',
      schedule_id: '일정 ID',
      song_id: '곡 ID',
    },
  },
  teams: {
    alias: 't',
    description: '밴드 내부 팀',
    columns: {
      id: '팀 ID',
      band_id: '밴드 ID',
      name: '팀 이름',
      description: '팀 설명',
      status: 'ACTIVE 또는 INACTIVE',
      team_leader_band_member_id: '팀장 밴드 멤버 ID',
      created_at: '생성 시각',
      updated_at: '수정 시각',
    },
  },
  team_members: {
    alias: 'tm',
    description: '팀 멤버',
    columns: {
      id: '팀 멤버 ID',
      team_id: '팀 ID',
      band_member_id: '밴드 멤버 ID',
      joined_at: '팀 가입 시각',
      team_role: 'LEADER 또는 MEMBER',
    },
  },
  team_songs: {
    alias: 'ts',
    description: '팀에 배정된 곡',
    columns: {
      id: '팀 곡 ID',
      team_id: '팀 ID',
      song_id: '곡 ID',
    },
  },
};

/** 허용 테이블을 밴드에서 시작하는 연결 그래프로 제한한다. */
export const SQL_CATALOG_JOINS: SqlCatalogJoin[] = [
  { left: 'bands.id', right: 'band_members.band_id' },
  { left: 'bands.id', right: 'band_spaces.band_id' },
  { left: 'bands.id', right: 'places.band_id' },
  { left: 'bands.id', right: 'songs.band_id' },
  { left: 'bands.id', right: 'teams.band_id' },
  { left: 'band_members.user_id', right: 'users.id' },
  { left: 'users.id', right: 'user_profiles.user_id' },
  { left: 'users.id', right: 'user_skills.user_id' },
  { left: 'user_skills.skill_type_id', right: 'skill_types.id' },
  { left: 'users.id', right: 'favorite_genres.user_id' },
  { left: 'favorite_genres.genre_id', right: 'genres.id' },
  { left: 'band_spaces.id', right: 'schedules.band_space_id' },
  { left: 'places.id', right: 'schedules.place_id' },
  { left: 'schedules.id', right: 'schedule_participants.schedule_id' },
  { left: 'band_members.id', right: 'schedule_participants.band_member_id' },
  { left: 'schedules.id', right: 'schedule_song.schedule_id' },
  { left: 'songs.id', right: 'schedule_song.song_id' },
  { left: 'songs.id', right: 'song_skills.song_id' },
  { left: 'song_skills.skill_type_id', right: 'skill_types.id' },
  { left: 'teams.id', right: 'team_members.team_id' },
  { left: 'band_members.id', right: 'team_members.band_member_id' },
  { left: 'teams.id', right: 'team_songs.team_id' },
  { left: 'songs.id', right: 'team_songs.song_id' },
];

export const SQL_ALLOWED_FUNCTIONS = new Set([
  'avg',
  'coalesce',
  'count',
  'date_trunc',
  'extract',
  'greatest',
  'least',
  'lower',
  'max',
  'min',
  'round',
  'sum',
  'trim',
  'upper',
]);

/** text 파라미터와 비교할 때 컬럼을 ::text로 변환해야 하는 PostgreSQL enum 컬럼이다. */
export const SQL_ENUM_COLUMNS = new Set([
  'band_members.role',
  'users.status',
  'user_skills.skill_level',
  'band_spaces.space_type',
  'band_spaces.status',
  'schedules.schedule_type',
  'schedules.status',
  'schedule_participants.attendance_status',
  'songs.key',
  'teams.status',
  'team_members.team_role',
]);

/** 의미상 양쪽 관계가 모두 필요한 중간 테이블의 필수 연결이다. */
export const SQL_REQUIRED_RELATIONS: Record<string, string[]> = {
  band_spaces: ['bands'],
  users: ['band_members'],
  user_profiles: ['users'],
  user_skills: ['users'],
  favorite_genres: ['users'],
  schedules: ['band_spaces'],
  schedule_participants: ['schedules', 'band_members'],
  schedule_song: ['schedules', 'songs'],
  song_skills: ['songs'],
  songs: ['bands'],
  teams: ['bands'],
  team_members: ['teams', 'band_members'],
  team_songs: ['teams', 'songs'],
};
