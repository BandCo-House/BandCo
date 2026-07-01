import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type DayScheduleBlock } from '@/entities/schedule/lib/day-window';
import { type ScheduleItem } from '@/entities/schedule/model/types';
import { DayScheduleCard } from './DayScheduleCard';

const schedule: ScheduleItem = {
  scheduleId: 'sch-1',
  spaceId: 'space-1',
  scheduleType: 'PRACTICE',
  title: '합주 A',
  startAt: '2026-03-17T09:00:00',
  endAt: '2026-03-17T15:00:00',
  place: { placeId: 'place-1', name: '신촌 연습실 A' },
  songs: [],
  participantCount: 5,
  participants: [
    { bandMemberId: 'm-1', nickname: '가나', profileImageUrl: null },
    { bandMemberId: 'm-2', nickname: '다라', profileImageUrl: null },
    { bandMemberId: 'm-3', nickname: '마바', profileImageUrl: null },
  ],
  isMine: true,
  memo: null,
  status: 'PLANNED',
};

// 6시 윈도 기준 09:00~15:00 = 180~540분 (6시간 → 참여 인원 표시 구간)
const block: DayScheduleBlock = {
  schedule,
  startMin: 180,
  endMin: 540,
  startLabel: '09:00',
  endLabel: '15:00',
  column: 0,
  totalColumns: 1,
};

describe('DayScheduleCard', () => {
  it('제목·시간·장소와 남은 참가자 수(+N)를 표시한다', () => {
    render(<DayScheduleCard block={block} slotHeight={64} />);

    expect(screen.getByText('합주 A')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 15:00')).toBeInTheDocument();
    expect(screen.getByText('신촌 연습실 A')).toBeInTheDocument();
    // 미리보기 3명 + 전체 5명 → 넘침 +2
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('클릭하면 일정 id로 콜백한다', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<DayScheduleCard block={block} slotHeight={64} onClick={onClick} />);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith('sch-1');
  });
});
