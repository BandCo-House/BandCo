import { SqlQueryValidator } from '../sql/sql-query.validator';

import { ASSISTANT_PRESETS, findPresetById } from './query-plan.presets';

describe('추천 질문 고정 SQL', () => {
  const validator = new SqlQueryValidator();
  const now = new Date('2026-10-06T08:54:00.000Z');

  it.each(ASSISTANT_PRESETS.map(preset => [preset.id, preset]))('%s는 자유 질문과 같은 검증기를 통과한다', async (_id, preset) => {
    const validated = await validator.validate(preset.createQuery(now));

    expect(validated.sql).toContain('$1');
    expect(validated.intent).toBe(preset.createQuery(now).intent);
  });

  it('이번 달 범위는 한국 시간 1일 0시부터 다음 달 1일 0시 전까지다', () => {
    const query = findPresetById('most-practiced-song-this-month')!.createQuery(new Date('2026-09-30T16:00:00.000Z'));

    // 9월 30일 16:00 UTC는 한국 시간 10월 1일 01:00이라 10월 범위여야 한다.
    expect(query.params.slice(2).map(param => param.value)).toEqual(['2026-09-30T15:00:00.000Z', '2026-10-31T15:00:00.000Z']);
  });

  it('추천 질문마다 그 답에 이어지는 자유 질문을 둔다', () => {
    for (const preset of ASSISTANT_PRESETS) {
      expect(preset.followUps.length).toBeGreaterThan(0);
      expect(preset.followUps).not.toContain(preset.question);
    }
  });

  it('다음 합주는 일정 이름과 장소까지 고른다', () => {
    expect(findPresetById('next-schedule')!.createQuery(now).sql).toMatch(/SELECT sc\.title, sc\.start_at, p\.name AS place_name/);
  });
});
