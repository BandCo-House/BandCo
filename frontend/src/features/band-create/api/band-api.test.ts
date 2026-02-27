import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { createBand } from './band-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('createBand 어댑터', () => {
  it('POST /bands 를 올바른 body로 호출하고 응답(id, name)을 반환한다', async () => {
    const requestBody = { name: '우리 밴드' };
    const responseData = { id: 'band-123', name: '우리 밴드' };

    mock.onPost('/bands', requestBody).reply(200, {
      success: true,
      data: responseData,
    });

    const result = await createBand(requestBody);

    expect(result).toEqual(responseData);
  });

  it('name이 서버에 그대로 전달된다', async () => {
    let capturedBody: unknown;

    mock.onPost('/bands').reply((config) => {
      capturedBody = JSON.parse(config.data as string);
      return [
        200,
        { success: true, data: { id: 'band-456', name: '테스트 밴드' } },
      ];
    });

    await createBand({ name: '테스트 밴드' });

    expect(capturedBody).toEqual({ name: '테스트 밴드' });
  });

  it('서버 에러(422) 시 reject된다', async () => {
    mock.onPost('/bands').reply(422, {
      success: false,
      error: { code: 'INVALID_INPUT', message: '이름이 올바르지 않습니다' },
    });

    await expect(createBand({ name: '' })).rejects.toThrow();
  });
});
