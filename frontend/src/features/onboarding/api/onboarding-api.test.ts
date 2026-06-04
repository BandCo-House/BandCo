import { describe, expect, it } from 'vitest';
import { getGenreOptions, getPartOptions } from './onboarding-api';

describe('onboardingApi', () => {
  it('장르 목록 요청은 온보딩 선택지 배열을 반환해야 한다', async () => {
    const genres = await getGenreOptions();

    expect(genres).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'rock', label: '록 (Rock)' }),
      ]),
    );
  });

  it('포지션 목록 요청은 온보딩 선택지 배열을 반환해야 한다', async () => {
    const parts = await getPartOptions();

    expect(parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'vocal', label: '보컬' }),
      ]),
    );
  });
});
