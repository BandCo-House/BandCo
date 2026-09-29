import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateBandBodyDto } from './create-band.dto';

// ─── UUID 상수 ───────────────────────────────────────────────────
// seed 마이그레이션(20260913120000)의 '록 (Rock)' — 이름 기반 UUID v5 고정 ID
const GENRE_ID_V5 = '370ce3f7-0e72-5ab0-a3c4-72e4887ac75a';
const GENRE_ID_V4 = '22222222-2222-4222-8222-222222222222';

const validateBody = (body: Record<string, unknown>) => validate(plainToInstance(CreateBandBodyDto, { name: '록밴드', visibility: true, ...body }));

describe('CreateBandBodyDto', () => {
  it('seed의 UUID v5 장르 ID를 통과시킨다', async () => {
    const errors = await validateBody({ genreIds: [GENRE_ID_V5] });

    expect(errors).toHaveLength(0);
  });

  it('UUID v4 장르 ID도 통과시킨다', async () => {
    const errors = await validateBody({ genreIds: [GENRE_ID_V4] });

    expect(errors).toHaveLength(0);
  });

  it('UUID 형식이 아닌 장르 ID는 거부한다', async () => {
    const errors = await validateBody({ genreIds: ['rock'] });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('genreIds');
    expect(errors[0].constraints).toEqual({ isUuid: 'genreIds은(는) 유효한 uuid이어야 합니다.' });
  });
});
