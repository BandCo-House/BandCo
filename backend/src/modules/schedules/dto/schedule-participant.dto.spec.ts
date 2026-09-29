import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ScheduleParticipantInputDto } from './schedule-participant.dto';

// ─── UUID 상수 ───────────────────────────────────────────────────
const BAND_MEMBER_ID = '11111111-1111-4111-8111-111111111111';
// seed 마이그레이션(20260913120000)의 '보컬' — 이름 기반 UUID v5 고정 ID
const SKILL_TYPE_ID_V5 = '97c8888a-7251-5d67-ba79-2103813bbecb';
const SKILL_TYPE_ID_V4 = '22222222-2222-4222-8222-222222222222';

const validateBody = (body: Record<string, unknown>) => validate(plainToInstance(ScheduleParticipantInputDto, body));

describe('ScheduleParticipantInputDto', () => {
  it('seed의 UUID v5 세션 ID를 통과시킨다', async () => {
    const errors = await validateBody({ bandMemberId: BAND_MEMBER_ID, skillTypeId: SKILL_TYPE_ID_V5 });

    expect(errors).toHaveLength(0);
  });

  it('UUID v4 세션 ID도 통과시킨다', async () => {
    const errors = await validateBody({ bandMemberId: BAND_MEMBER_ID, skillTypeId: SKILL_TYPE_ID_V4 });

    expect(errors).toHaveLength(0);
  });

  it('UUID 형식이 아닌 세션 ID는 거부한다', async () => {
    const errors = await validateBody({ bandMemberId: BAND_MEMBER_ID, skillTypeId: 'vocal' });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('skillTypeId');
    expect(errors[0].constraints).toEqual({ isUuid: 'skillTypeId은(는) 유효한 uuid이어야 합니다.' });
  });
});
