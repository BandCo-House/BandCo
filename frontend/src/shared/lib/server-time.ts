/**
 * 서버 기준 현재 시각.
 *
 * 마감처럼 "서버가 판정하는 경계"를 화면에서 미리 보여줄 때 클라이언트 시계를
 * 그대로 쓰면, 시계가 빠른 기기에서는 서버가 아직 받아주는 투표를 UI가 먼저
 * 막아버린다. 응답의 Date 헤더로 시계 차를 재서 보정한다.
 *
 * 헤더를 한 번도 못 보면 보정값은 0이라 클라이언트 시각 그대로 동작한다
 * (프록시가 헤더를 지우거나 dev의 MSW처럼 헤더가 없는 환경).
 */
let offsetMs = 0;

/** 응답의 Date 헤더로 시계 차를 갱신한다. 파싱되지 않는 값은 무시한다. */
export const syncServerTime = (dateHeader: unknown): void => {
  if (typeof dateHeader !== 'string') return;

  const serverTime = Date.parse(dateHeader);
  if (Number.isNaN(serverTime)) return;

  offsetMs = serverTime - Date.now();
};

/**
 * 서버 기준 현재 시각(ms).
 *
 * Date 헤더는 초 단위라 보정 오차가 최대 1초쯤 남는다. 마감 판정에는 충분하지만,
 * 최종 판정은 어차피 서버가 하고 프론트는 입력을 버리지 않게 미리 막는 용도다.
 */
export const serverNow = (): number => Date.now() + offsetMs;
