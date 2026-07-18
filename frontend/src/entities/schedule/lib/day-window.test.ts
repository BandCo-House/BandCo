import { describe, it, expect } from 'vitest';
import { clipToDayWindow } from './day-window';
import { type ScheduleItem } from '../model/types';

const makeSchedule = (startAt: string, endAt: string): ScheduleItem => ({
  scheduleId: '1',
  spaceId: 'space-1',
  scheduleType: 'PRACTICE',
  title: '테스트',
  startAt,
  endAt,
  place: null,
  team: null,
  songs: [],
  participantCount: 0,
  isMine: false,
  memo: null,
  status: 'PLANNED',
});

// 윈도: 2026-03-17 06:00 ~ 2026-03-18 06:00 (로컬)
const windowStart = new Date(2026, 2, 17, 6, 0, 0, 0);
const windowEnd = new Date(2026, 2, 18, 6, 0, 0, 0);

const clip = (startAt: string, endAt: string) =>
  clipToDayWindow(makeSchedule(startAt, endAt), windowStart, windowEnd);

describe('clipToDayWindow', () => {
  it('윈도 안 일정은 윈도 시작 기준 분으로 변환한다', () => {
    const block = clip('2026-03-17T09:00:00', '2026-03-17T11:00:00');
    expect(block?.startMin).toBe(180); // 09:00 = 06:00 + 3h
    expect(block?.endMin).toBe(300); // 11:00
    expect(block?.startLabel).toBe('09:00');
    expect(block?.endLabel).toBe('11:00');
  });

  it('06시 경계를 가로지르면 시작을 06:00으로 잘라 상단(0분)에 둔다', () => {
    // 05:00~08:00 → 06:00~08:00 (라벨은 원래 시각)
    const block = clip('2026-03-17T05:00:00', '2026-03-17T08:00:00');
    expect(block?.startMin).toBe(0);
    expect(block?.endMin).toBe(120);
    expect(block?.startLabel).toBe('05:00');
  });

  it('자정을 넘겨 다음 날 새벽까지 이어지면 하단으로 이어진다', () => {
    // 22:00~다음 날 01:30 → 960분 ~ 1170분
    const block = clip('2026-03-17T22:00:00', '2026-03-18T01:30:00');
    expect(block?.startMin).toBe(960); // 22:00 = 06:00 + 16h
    expect(block?.endMin).toBe(1170); // 다음 날 01:30 = 06:00 + 19.5h
  });

  it('윈도를 벗어나는 일정은 null을 반환한다', () => {
    // 다음 날 06:00 이후(다음 윈도 소속)
    expect(clip('2026-03-18T07:00:00', '2026-03-18T09:00:00')).toBeNull();
    // 당일 06:00 이전에 끝남(전날 윈도 소속)
    expect(clip('2026-03-17T03:00:00', '2026-03-17T05:00:00')).toBeNull();
  });
});
