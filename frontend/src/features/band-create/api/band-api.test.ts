import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { createBand } from './band-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('createBand 어댑터', () => {
  it('POST /bands 를 올바른 body로 호출하고 응답 band를 반환한다', async () => {
    const requestBody = {
      name: '우리 밴드',
      description: '주 1회 합주',
      visibility: true,
    };
    const responseData = {
      band: {
        id: 'band-123',
        name: '우리 밴드',
        description: '주 1회 합주',
        visibility: true,
        inviteCode: 'INV123',
        bmId: 'bm-1',
        createdAt: '2026-03-03T18:20:10.123+09:00',
        updatedAt: '2026-03-03T18:20:10.123+09:00',
      },
    };

    mock.onPost('/bands', requestBody).reply(200, {
      status: 'success',
      error: null,
      message: '밴드 생성 성공',
      data: responseData,
    });

    const result = await createBand(requestBody);

    expect(result).toEqual(responseData.band);
  });

  it('name, description, visibility가 서버에 그대로 전달된다', async () => {
    let capturedBody: unknown;

    mock.onPost('/bands').reply((config) => {
      capturedBody = JSON.parse(config.data as string);
      return [
        200,
        {
          status: 'success',
          error: null,
          message: '밴드 생성 성공',
          data: {
            band: {
              id: 'band-456',
              name: '테스트 밴드',
              description: null,
              visibility: true,
              inviteCode: 'INV456',
              bmId: 'bm-1',
              createdAt: '2026-03-03T18:20:10.123+09:00',
              updatedAt: '2026-03-03T18:20:10.123+09:00',
            },
          },
        },
      ];
    });

    await createBand({ name: '테스트 밴드', description: null, visibility: true });

    expect(capturedBody).toEqual({
      name: '테스트 밴드',
      description: null,
      visibility: true,
    });
  });

  it('서버 에러(422) 시 reject된다', async () => {
    mock.onPost('/bands').reply(422, {
      success: false,
      error: { code: 'INVALID_INPUT', message: '이름이 올바르지 않습니다' },
    });

    await expect(
      createBand({ name: '', description: null, visibility: true }),
    ).rejects.toThrow();
  });
});
