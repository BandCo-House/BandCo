import { getHandleChangeableAt, HANDLE_CHANGE_COOLDOWN_MS } from './handle-cooldown';

const NOW = new Date('2026-10-19T06:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

describe('getHandleChangeableAt', () => {
  it('쿨다운 기준 시각이 없으면 null이다', () => {
    expect(getHandleChangeableAt(null, NOW)).toBeNull();
  });

  it('바꾼 지 7일이 안 됐으면 기준 시각 + 7일을 돌려준다', () => {
    const changedAt = new Date(NOW.getTime() - DAY_MS);

    expect(getHandleChangeableAt(changedAt, NOW)).toEqual(new Date(changedAt.getTime() + HANDLE_CHANGE_COOLDOWN_MS));
  });

  it('바꾼 지 정확히 7일이면 null이다', () => {
    const changedAt = new Date(NOW.getTime() - HANDLE_CHANGE_COOLDOWN_MS);

    expect(getHandleChangeableAt(changedAt, NOW)).toBeNull();
  });

  it('바꾼 지 7일이 넘었으면 null이다', () => {
    const changedAt = new Date(NOW.getTime() - 8 * DAY_MS);

    expect(getHandleChangeableAt(changedAt, NOW)).toBeNull();
  });
});
