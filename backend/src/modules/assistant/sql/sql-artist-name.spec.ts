import type { ValidatedSqlQuery } from './generated-sql.type';
import { createCandidateQuestion, readArtistNameBindings, resolveArtistName } from './sql-artist-name';

const from = 'FROM bands b JOIN songs so ON so.band_id = b.id WHERE b.id = $1 AND b.deleted_at IS NULL AND ';
const query = (condition: string, parameters: ValidatedSqlQuery['parameters'] = ['B']): ValidatedSqlQuery => ({
  intent: '곡 조회',
  sql: `SELECT so.title ${from}${condition}`,
  parameters,
  parameterTypes: parameters.map(() => 'TEXT'),
});

describe('아티스트 이름 확인', () => {
  it.each(['so.artist_name = $2', '$2 = so.artist_name', 'so.artist_name::text = $2::text'])(
    '직접 equality %s의 TEXT 파라미터만 찾는다',
    async condition => {
      expect(await readArtistNameBindings(query(condition))).toEqual([{ position: 2, value: 'B' }]);
    },
  );

  it.each([
    "so.artist_name = $2 OR so.title = '알파'",
    'NOT (so.artist_name = $2)',
    'so.artist_name LIKE $2',
    'so.artist_name = ANY($2)',
    'so.artist_name::int = $2',
    'so.artist_name = $2 AND so.title = $2',
    'so.artist_name = $2 AND EXISTS (SELECT 1 FROM songs inner_song WHERE inner_song.title = $2)',
  ])('OR·NOT·패턴·공유 파라미터를 보정하지 않는다: %s', async condition => {
    expect(await readArtistNameBindings(query(condition))).toEqual([]);
  });

  it('출력에 공유한 값과 다른 타입·빈 이름도 보정하지 않는다', async () => {
    const projected = { ...query('so.artist_name = $2'), sql: `SELECT so.title, $2 ${from}so.artist_name = $2` };
    expect(await readArtistNameBindings(projected)).toEqual([]);
    expect(await readArtistNameBindings({ ...query('so.artist_name = $2'), parameterTypes: ['DATE'] })).toEqual([]);
    expect(await readArtistNameBindings(query('so.artist_name = $2', ['']))).toEqual([]);
  });

  it('각 이름과 비교하는 파라미터를 분리하고 다른 숫자 조건을 보존한다', async () => {
    const q = query('so.artist_name = $2 AND so.bpm >= $3', ['B', 120]);
    q.parameterTypes = ['TEXT', 'INTEGER'];
    expect(await readArtistNameBindings(q)).toEqual([{ position: 2, value: 'B' }]);
    expect(q.parameters).toEqual(['B', 120]);
  });

  it('정확 일치·유일 후보·질문에 적힌 완전한 이름을 선택한다', () => {
    expect(resolveArtistName('B', 'B의 곡', ['B', '아티스트 B'])).toEqual({ name: 'B' });
    expect(resolveArtistName('B', '아티스트 B의 곡', ['B', '아티스트 B'])).toEqual({ name: '아티스트 B' });
    expect(resolveArtistName('B', 'B의 곡', ['아티스트 B'])).toEqual({ name: '아티스트 B' });
    expect(resolveArtistName('artist b', 'artist b의 곡', ['Artist B'])).toEqual({ name: 'Artist B' });
  });

  it('여러 후보와 대소문자만 다른 여러 이름은 임의로 선택하지 않는다', () => {
    expect(resolveArtistName('아티스트', '아티스트의 곡', ['아티스트 A', '아티스트 B'])).toEqual({
      candidates: ['아티스트 A', '아티스트 B'],
      hasMore: false,
    });
    expect(resolveArtistName('ARTIST', 'ARTIST의 곡', ['Artist', 'artist'])).toEqual({ candidates: ['Artist', 'artist'], hasMore: false });
  });

  it('없는 이름은 원래 값을 유지하고 잘린 후보는 안내하되 따옴표의 정확 이름은 확정한다', () => {
    expect(resolveArtistName('Z', 'Z 곡', [])).toEqual({ name: 'Z' });
    expect(resolveArtistName('B', "'B' 곡", ['아티스트 B'])).toEqual({ candidates: ['아티스트 B'], hasMore: false });
    const candidates = ['B', 'B1', 'B2', 'B3', 'B4', 'B5'];
    expect(resolveArtistName('B', 'B 곡', candidates)).toEqual({ candidates: candidates.slice(0, 5), hasMore: true });
    expect(resolveArtistName('B', '“B”의 곡', candidates)).toEqual({ name: 'B' });
    expect(resolveArtistName('B', '“B1”의 곡', candidates)).toHaveProperty('candidates');
  });

  it('후보 질문은 질문 속 이름을 따옴표 친 후보로 바꾸고, 이름이 없으면 뒤에 덧붙인다', () => {
    expect(createCandidateQuestion("'아티스트' 곡 알려줘", '아티스트', '아티스트 A')).toBe("'아티스트 A' 곡 알려줘");
    expect(createCandidateQuestion('아티스트 노래 뭐 있어?', '아티스트', '아티스트 B')).toBe("'아티스트 B' 노래 뭐 있어?");
    expect(createCandidateQuestion('그 사람 노래', 'Queen', 'Queen II')).toBe("그 사람 노래 (아티스트 'Queen II')");
  });
});
