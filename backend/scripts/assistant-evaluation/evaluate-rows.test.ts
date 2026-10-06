import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Prisma } from '../../src/generated/prisma';

import { evaluateRows, type EvaluationContract } from './evaluate-rows';

const textContract: EvaluationContract = {
  goldSql: 'SELECT b.name, b.description FROM bands b',
  columns: [
    { key: 'name', type: 'text' },
    { key: 'description', type: 'text' },
  ],
};
const numericContract: EvaluationContract = {
  goldSql: 'SELECT ROUND(AVG(s.bpm)::numeric, 2) AS average_bpm FROM songs s',
  columns: [{ key: 'average_bpm', type: 'decimal' }],
};
const winnerContract: EvaluationContract = {
  goldSql: 'SELECT s.title, COUNT(p.id) AS practice_count FROM songs s JOIN schedule_song p ON p.song_id = s.id GROUP BY s.title',
  columns: [
    { key: 'title', type: 'text' },
    { key: 'practice_count', type: 'decimal' },
  ],
  tiePolicy: 'one-or-all',
};

test('기존 값 정렬 방식이 놓치는 컬럼 값 교환을 거부한다', async () => {
  const expected = [{ name: '밴드', description: '소개' }];
  const actual = [{ name: '소개', description: '밴드' }];
  assert.deepEqual(Object.values(expected[0]).sort(), Object.values(actual[0]).sort());
  assert.equal((await evaluateRows(textContract, expected, actual, textContract.goldSql)).matches, false);
});

test('같은 의미의 컬럼은 별칭과 SELECT 순서가 달라도 대응한다', async () => {
  const actualSql = 'SELECT band.description AS about, band.name AS band_name FROM bands band';
  const result = await evaluateRows(textContract, [{ name: '밴드', description: '소개' }], [{ about: '소개', band_name: '밴드' }], actualSql);
  assert.equal(result.matches, true);
});

test('같은 이름이라도 다른 테이블의 컬럼을 대신 대응시키지 않는다', async () => {
  const result = await evaluateRows(
    textContract,
    [{ name: '밴드', description: '소개' }],
    [{ name: '밴드', description: '소개' }],
    'SELECT t.name, t.description FROM teams t',
  );
  assert.equal(result.reason, 'COLUMN_MAPPING_FAILED');
});

test('Decimal 객체·문자열·안전한 숫자의 같은 값을 허용한다', async () => {
  for (const value of [new Prisma.Decimal('120.50'), '120.50', 120.5]) {
    const result = await evaluateRows(numericContract, [{ average_bpm: '120.5' }], [{ average_bpm: value }], numericContract.goldSql);
    assert.equal(result.matches, true);
  }
});

test('큰 정밀도의 문자열 숫자는 서로 다른 값을 유지한다', async () => {
  const result = await evaluateRows(
    numericContract,
    [{ average_bpm: '9007199254740993.123456789' }],
    [{ average_bpm: '9007199254740993.123456788' }],
    numericContract.goldSql,
  );
  assert.equal(result.matches, false);
});

test('이미 정밀도를 잃을 수 있는 Number와 유한하지 않은 값은 거부한다', async () => {
  for (const value of [9007199254740992, Number.NaN, 'Infinity', undefined]) {
    const result = await evaluateRows(numericContract, [{ average_bpm: '1' }], [{ average_bpm: value }], numericContract.goldSql);
    assert.equal(result.reason, 'INVALID_RESULT_TYPE');
  }
});

test('문자열 ID는 숫자로 정규화하지 않는다', async () => {
  const contract: EvaluationContract = { goldSql: 'SELECT b.id FROM bands b', columns: [{ key: 'id', type: 'text' }] };
  assert.equal((await evaluateRows(contract, [{ id: '001' }], [{ id: '1' }], contract.goldSql)).matches, false);
});

test('공동 1위 한 곡 또는 전체만 허용하고 중복·빈 결과·부분 집합·낮은 순위는 거부한다', async () => {
  const expected = ['가', '나', '다'].map(title => ({ title, practice_count: 2 }));
  const cases = [
    { rows: [expected[1]], matches: true },
    { rows: [...expected].reverse(), matches: true },
    { rows: [], matches: false },
    { rows: [expected[0], expected[0]], matches: false },
    { rows: expected.slice(0, 2), matches: false },
    { rows: [{ title: '라', practice_count: 1 }], matches: false },
  ];
  for (const item of cases) {
    assert.equal((await evaluateRows(winnerContract, expected, item.rows, winnerContract.goldSql)).matches, item.matches);
  }
});

test('공동 1위 전체를 요구하면 한 곡만 반환한 결과를 거부한다', async () => {
  const expected = ['가', '나'].map(title => ({ title, practice_count: 2 }));
  const contract = { ...winnerContract, tiePolicy: undefined };
  assert.equal((await evaluateRows(contract, expected, expected.slice(0, 1), contract.goldSql)).matches, false);
});

test('한 명을 요구하면 공동 1위 중 한 명만 허용한다', async () => {
  const expected = ['가', '나'].map(title => ({ title, practice_count: 2 }));
  const contract: EvaluationContract = { ...winnerContract, tiePolicy: 'one' };
  assert.equal((await evaluateRows(contract, expected, [expected[1]], contract.goldSql)).matches, true);
  assert.equal((await evaluateRows(contract, expected, expected, contract.goldSql)).matches, false);
});

test('행 순서 요구 여부와 무관하게 중복 행 개수를 보존한다', async () => {
  const contract: EvaluationContract = { goldSql: 'SELECT b.name FROM bands b', columns: [{ key: 'name', type: 'text' }] };
  const expected = [{ name: '가' }, { name: '나' }];
  const actual = [...expected].reverse();
  assert.equal((await evaluateRows(contract, expected, actual, contract.goldSql)).matches, true);
  assert.equal((await evaluateRows({ ...contract, orderSensitive: true }, expected, actual, contract.goldSql)).matches, false);
  assert.equal((await evaluateRows(contract, expected, [...expected, expected[0]], contract.goldSql)).matches, false);
});

test('Date 객체와 시간대가 다른 같은 순간을 비교한다', async () => {
  const contract: EvaluationContract = { goldSql: 'SELECT s.start_at FROM schedules s', columns: [{ key: 'start_at', type: 'timestamp' }] };
  const result = await evaluateRows(
    contract,
    [{ start_at: new Date('2026-09-01T00:00:00Z') }],
    [{ start_at: '2026-09-01T09:00:00+09:00' }],
    contract.goldSql,
  );
  assert.equal(result.matches, true);
});

test('추가 출력 컬럼과 모호한 여러 집계 컬럼을 거부한다', async () => {
  const extra = await evaluateRows(numericContract, [{ average_bpm: '120.5' }], [{ average_bpm: '120.5', id: 'x' }], numericContract.goldSql);
  assert.equal(extra.matches, false);
  const contract: EvaluationContract = {
    goldSql: 'SELECT COUNT(s.id) AS first_count, COUNT(s.band_id) AS second_count FROM songs s',
    columns: [
      { key: 'first_count', type: 'decimal' },
      { key: 'second_count', type: 'decimal' },
    ],
  };
  const result = await evaluateRows(contract, [{ first_count: 1, second_count: 2 }], [{ first_count: 1, second_count: 2 }], contract.goldSql);
  assert.equal(result.reason, 'COLUMN_MAPPING_FAILED');
});
