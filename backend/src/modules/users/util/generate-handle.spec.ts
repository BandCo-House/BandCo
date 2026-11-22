import { HANDLE_PATTERN } from '../constants/user-profile.constant';

import { GENERATED_HANDLE_MAX_ATTEMPTS, generateRandomHandle, pickAvailableHandle } from './generate-handle';

/** 앞에서부터 takenCount개 후보는 쓰이는 것으로 답하고, 확인한 후보를 기록하는 콜백 */
function createIsTakenStub(takenCount: number) {
  const checked: string[] = [];
  const isTaken = async (handle: string): Promise<boolean> => {
    checked.push(handle);
    return checked.length <= takenCount;
  };
  return { isTaken, checked };
}

describe('generateRandomHandle', () => {
  it('소문자·숫자 8자이며 고유 ID 형식을 통과한다', () => {
    for (let i = 0; i < 50; i++) {
      const handle = generateRandomHandle();

      expect(handle).toMatch(/^[a-z0-9]{8}$/);
      expect(handle).toMatch(HANDLE_PATTERN);
    }
  });
});

describe('pickAvailableHandle', () => {
  it('첫 후보가 비어 있으면 바로 돌려준다', async () => {
    const { isTaken, checked } = createIsTakenStub(0);

    const handle = await pickAvailableHandle(isTaken);

    expect(checked).toEqual([handle]);
  });

  it('후보가 쓰이고 있으면 다시 뽑는다', async () => {
    const { isTaken, checked } = createIsTakenStub(1);

    const handle = await pickAvailableHandle(isTaken);

    expect(checked).toHaveLength(2);
    expect(checked[1]).toBe(handle);
  });

  it('최대 횟수 동안 모두 쓰이고 있으면 에러를 던진다', async () => {
    const { isTaken, checked } = createIsTakenStub(Infinity);

    await expect(pickAvailableHandle(isTaken)).rejects.toThrow('랜덤 고유 ID를 고르지 못했습니다.');
    expect(checked).toHaveLength(GENERATED_HANDLE_MAX_ATTEMPTS);
  });
});
