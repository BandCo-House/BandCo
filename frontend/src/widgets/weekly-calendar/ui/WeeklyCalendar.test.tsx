import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WeeklyCalendar } from './WeeklyCalendar';
import { getStartOfWeek, getWeekDays } from '@/shared/lib/date';

describe('WeeklyCalendar (주간 일정표)', () => {
  // 테스트를 위해 시스템 시간을 고정합니다.
  beforeEach(() => {
    // 2026-03-04 (수요일)을 현재 시간으로 고정
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 4));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기 렌더링 시 현재 주의 월~일 날짜가 표시되어야 합니다', () => {
    render(<WeeklyCalendar />);

    const currentWeekStart = getStartOfWeek(new Date());
    const weekDays = getWeekDays(currentWeekStart);

    // 각 요일의 날짜 번호가 화면에 렌더링되었는지 확인합니다.
    const dayLabels = screen.getAllByTestId('day-label');
    expect(dayLabels).toHaveLength(7);

    weekDays.forEach((day, index) => {
      const dateString = day.getDate().toString();
      expect(dayLabels[index]).toHaveTextContent(dateString);
    });
  });

  it('01시부터 24시까지의 시간대 레이블이 모두 렌더링되어야 합니다', () => {
    render(<WeeklyCalendar />);

    // 01:00, 02:00, ..., 24:00 텍스트가 존재하는지 확인
    for (let i = 1; i <= 24; i++) {
      const timeString = `${i.toString().padStart(2, '0')}:00`;
      expect(screen.getByText(timeString)).toBeInTheDocument();
    }
  });

  it('168개의(7일 x 24시간) 일정 슬롯이 존재해야 합니다', () => {
    render(<WeeklyCalendar />);

    // data-testid="time-slot" 인 요소들을 찾습니다.
    const slots = screen.getAllByTestId('time-slot');
    expect(slots).toHaveLength(7 * 24);
  });

  it('이전/다음 버튼 클릭 시 이전 주 또는 다음 주로 날짜가 변경되어야 합니다', () => {
    // 2026-03-04 (수요일) 기준 렌더링
    render(<WeeklyCalendar />);

    const prevButton = screen.getByRole('button', { name: /이전 주/i });
    const nextButton = screen.getByRole('button', { name: /다음 주/i });

    // 초기: 3월 2일(월요일)부터 표시되는지 확인
    let dayLabels = screen.getAllByTestId('day-label');
    expect(dayLabels[0]).toHaveTextContent('2');
    expect(screen.getByText('2026년 3월 2일 ~ 8일')).toBeInTheDocument();

    // 다음 주 클릭 -> 2026-03-09(월요일) 등 표시 검증
    fireEvent.click(nextButton);
    dayLabels = screen.getAllByTestId('day-label');
    expect(dayLabels[0]).toHaveTextContent('9');
    expect(dayLabels[6]).toHaveTextContent('15'); // 3월 15일 일요일
    expect(screen.getByText('2026년 3월 9일 ~ 15일')).toBeInTheDocument();

    // 이전 주를 두 번 클릭 -> 2026-02-23(월요일) 표시 검증
    fireEvent.click(prevButton);
    fireEvent.click(prevButton);
    dayLabels = screen.getAllByTestId('day-label');
    expect(dayLabels[0]).toHaveTextContent('23');
    expect(dayLabels[6]).toHaveTextContent('1'); // 3월 1일 일요일
    expect(screen.getByText('2026년 2월 23일 ~ 3월 1일')).toBeInTheDocument();
  });
});
