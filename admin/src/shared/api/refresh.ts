/**
 * 동시에 여러 요청이 401을 받아도 토큰 재발급은 한 번만 일어나도록 묶는다.
 * 진행 중인 재발급이 있으면 같은 Promise를 돌려주고, 끝나면(성공·실패 무관) 다음 호출에서 새로 시작한다.
 */
export const createRefreshDeduper = (
  refresh: () => Promise<string>,
): (() => Promise<string>) => {
  let pending: Promise<string> | null = null;

  return () => {
    if (!pending) {
      pending = refresh().finally(() => {
        pending = null;
      });
    }
    return pending;
  };
};
