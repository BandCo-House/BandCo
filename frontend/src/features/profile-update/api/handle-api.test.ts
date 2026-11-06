import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { changeHandle, checkHandleAvailability } from './handle-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

const success = (data: unknown) => ({
  status: 'success',
  error: null,
  message: '성공',
  data,
});

describe('고유 ID 어댑터', () => {
  it('중복 확인은 handle을 쿼리로 보내고 사용 가능 여부를 돌려준다', async () => {
    mock
      .onGet('/users/handles/availability', { params: { handle: 'devjun' } })
      .reply(200, success({ handle: 'devjun', available: false }));

    await expect(checkHandleAvailability('devjun')).resolves.toEqual({
      handle: 'devjun',
      available: false,
    });
  });

  it('변경은 본인 경로로 handle을 보내고 다음 변경 가능 시각을 돌려준다', async () => {
    const result = {
      userId: 'user-001',
      handle: 'devjun',
      handleChangedAt: '2026-10-19T06:00:00.000Z',
      handleChangeableAt: '2026-10-26T06:00:00.000Z',
    };
    mock
      .onPatch('/users/user-001/handle', { handle: 'devjun' })
      .reply(200, success(result));

    await expect(changeHandle('user-001', 'devjun')).resolves.toEqual(result);
  });

  it('변경 응답에 다음 변경 가능 시각이 빠지면 parse가 실패한다', async () => {
    mock.onPatch('/users/user-001/handle').reply(
      200,
      success({
        userId: 'user-001',
        handle: 'devjun',
        handleChangedAt: null,
      }),
    );

    await expect(changeHandle('user-001', 'devjun')).rejects.toThrow();
  });
});
