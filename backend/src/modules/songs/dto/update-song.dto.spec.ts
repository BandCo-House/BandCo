import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateSongBodyDto } from './update-song.dto';

// ─── UUID 상수 ───────────────────────────────────────────────────
// seed 마이그레이션(20260913120000)의 '보컬' — 이름 기반 UUID v5 고정 ID
const SKILL_TYPE_ID_V5 = '97c8888a-7251-5d67-ba79-2103813bbecb';
const SKILL_TYPE_ID_V4 = '22222222-2222-4222-8222-222222222222';

const validateBody = (body: Record<string, unknown>) => validate(plainToInstance(UpdateSongBodyDto, body));

describe('UpdateSongBodyDto', () => {
  it('seed의 UUID v5 스킬 타입 ID를 통과시킨다', async () => {
    const errors = await validateBody({ skillTypeIds: [SKILL_TYPE_ID_V5] });

    expect(errors).toHaveLength(0);
  });

  it('UUID v4 스킬 타입 ID도 통과시킨다', async () => {
    const errors = await validateBody({ skillTypeIds: [SKILL_TYPE_ID_V4] });

    expect(errors).toHaveLength(0);
  });

  it('UUID 형식이 아닌 스킬 타입 ID는 거부한다', async () => {
    const errors = await validateBody({ skillTypeIds: ['vocal'] });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('skillTypeIds');
    expect(errors[0].constraints).toEqual({ isUuid: 'skillTypeIds은(는) 유효한 uuid이어야 합니다.' });
  });
});
