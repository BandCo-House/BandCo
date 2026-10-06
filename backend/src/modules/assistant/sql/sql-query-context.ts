import { SQL_CATALOG_JOINS, SQL_REQUIRED_RELATIONS } from './sql-catalog';

interface QueryContext {
  matches: RegExp;
  instruction: string[];
}

const QUERY_CONTEXTS: QueryContext[] = [
  {
    matches: /참석|불참|응답|참여|대상자/,
    instruction: [
      '참여 조회는 bands → band_spaces → schedules → schedule_participants와 bands → band_members를 모두 연결한다.',
      'schedule_participants.schedule_id = schedules.id AND schedule_participants.band_member_id = band_members.id가 모두 필요하다.',
      '한 사람이 여러 세션 행을 가진다. 인원은 COUNT(DISTINCT sp.band_member_id), 멤버의 참석 횟수는 COUNT(DISTINCT sp.schedule_id)다. 명단도 중복 멤버를 제거한다.',
      '다음 합주 인원은 먼저 PRACTICE·PLANNED·현재 이후 조건으로 일정 ID 하나를 선택하고, 바깥에서 그 일정의 참여 행과 band_members를 연결한다.',
      '참석 횟수 통계에는 schedules와 band_spaces도 연결하고 취소 일정을 제외한다. 참여 행만 세어 일정 상태를 생략하지 않는다.',
    ],
  },
  {
    matches: /곡|노래|연습|편성/,
    instruction: [
      '곡 편성 조회는 bands → band_spaces → schedules → schedule_song → songs를 연결하며 songs.band_id = bands.id도 직접 적용한다.',
      '미편성 곡의 NOT EXISTS 안에서도 schedule_song은 schedules와 songs 양쪽에 연결하고, schedules → band_spaces → bands 범위를 적용한다.',
      'NOT EXISTS에서 schedule_song.song_id만 검사하고 필수 관계를 생략하지 않는다. 바깥 곡 ID와 안쪽 곡 ID를 연결해 해당 곡의 편성 존재 여부를 판단한다.',
    ],
  },
  {
    matches: /팀/,
    instruction: [
      '팀 멤버는 teams → team_members → band_members 양쪽 관계를 사용한다. 팀 인원은 COUNT(DISTINCT tm.band_member_id)다.',
      '팀장은 teams.team_leader_band_member_id = band_members.id → users → user_profiles로 닉네임을 조회한다.',
      '팀 배정 곡은 teams → team_songs → songs와 songs.band_id = bands.id를 모두 연결한다. 팀에서 곡으로 이어져도 songs의 직접 bands 관계를 생략하지 않는다.',
    ],
  },
  {
    matches: /악기|숙련|기타|드럼|베이스|보컬/,
    instruction: [
      '악기 조회는 bands → band_members → users → user_skills → skill_types다. band_members와 user_skills를 users 없이 직접 연결하지 않는다.',
      '주 악기 컬럼은 user_skills.is_primary이며 skill_types.name은 악기 이름이다. is_main 같은 새 컬럼을 만들지 않는다.',
      '악기별 인원 통계에서도 users.deleted_at IS NULL을 적용한다.',
    ],
  },
  {
    matches: /일정|합주|회의|합주실/,
    instruction: [
      '일정 목록은 별도 취소 제외 요청이 없으면 CANCELED도 포함한다. 기간·장소 목록에 통계의 취소 제외 기본값을 적용하지 않는다.',
      '일정 횟수·참석·편성 통계는 별도 요청이 없으면 CANCELED를 제외한다. 취소 포함을 명시하면 그 요청을 따른다.',
    ],
  },
];

/** 질문에 필요한 관계·집계 규칙을 제공한다. 전역 허용 정책과 전체 스키마는 별도로 유지한다. */
export function createSqlQueryContext(question: string): string {
  const instructions = QUERY_CONTEXTS.filter(context => context.matches.test(question)).flatMap(context => context.instruction);
  return instructions.length === 0 ? '' : ['# 이 질문의 관계·집계 맥락', ...instructions.map(instruction => `- ${instruction}`)].join('\n');
}

/** 반복된 관계 오류에는 실제 카탈로그의 필수 연결을 구체적으로 제공한다. */
export function createSqlRelationRepairHint(failure: string): string {
  const table = /REQUIRED_RELATION_MISSING: ([a-z_]+) 별칭/.exec(failure)?.[1];
  if (!table || !SQL_REQUIRED_RELATIONS[table]) return '';
  const joins = SQL_REQUIRED_RELATIONS[table].flatMap(required =>
    SQL_CATALOG_JOINS.filter(join => {
      const left = join.left.split('.')[0];
      const right = join.right.split('.')[0];
      return (left === table && right === required) || (left === required && right === table);
    }).map(join => `${join.left} = ${join.right}`),
  );
  return `# 필요한 관계 복구\n${table}를 사용한 각 SELECT와 중첩 SELECT에서 다음 직접 관계를 모두 구성한다:\n${joins.join('\n')}`;
}
