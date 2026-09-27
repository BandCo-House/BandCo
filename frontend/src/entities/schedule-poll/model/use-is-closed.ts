import { useEffect, useState } from 'react';

// setTimeout은 이 값을 넘기면 즉시 발화한다(32비트 오버플로).
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * 투표가 마감됐는지. 마감되는 순간 한 번 다시 렌더해 화면이 스스로 바뀌게 한다.
 *
 * 마운트 시점 한 번만 판정하면, 화면을 열어둔 채 마감을 넘긴 사용자가 편집을
 * 시작할 수 있다. 제출은 백엔드가 400으로 막으므로 고른 시간이 그대로 버려진다.
 */
export const useIsSchedulePollClosed = (
  closesAt: string | undefined,
): boolean => {
  // 렌더 중 Date.now()는 순수성 규칙 위반이라 상태로 들고 타이머로만 갱신한다.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (closesAt === undefined) return;

    const remaining = new Date(closesAt).getTime() - Date.now();
    // 이미 지났으면 갱신할 것이 없고, 아주 먼 마감은 타이머를 걸지 않는다
    // (그때까지 화면을 열어둘 일이 없고, 재진입하면 다시 계산된다).
    if (remaining <= 0 || remaining > MAX_TIMEOUT_MS) return;

    const timer = setTimeout(() => setNow(Date.now()), remaining);
    return () => clearTimeout(timer);
  }, [closesAt]);

  return closesAt !== undefined && new Date(closesAt).getTime() <= now;
};
