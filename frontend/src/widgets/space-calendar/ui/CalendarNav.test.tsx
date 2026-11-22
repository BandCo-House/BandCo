import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CalendarNav } from './CalendarNav';

describe('CalendarNav', () => {
  it('주별 보기에서는 주차까지 제목에 보여주고 화살표가 7일씩 옮긴다', () => {
    const onChange = vi.fn();
    // 올해 날짜로 고정해 연도 생략 규칙과 무관하게 같은 결과를 본다(10월 11일은 해마다 2·3주차가 갈려 연도를 고정한다).
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 1));
    render(
      <CalendarNav
        view="week"
        onViewChange={vi.fn()}
        value={new Date(2026, 9, 11)}
        onChange={onChange}
      />,
    );

    // 올해면 연도를 뺀다.
    expect(screen.getByText('10월 3주차')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다음 주' }));
    expect(onChange.mock.calls[0]?.[0].getDate()).toBe(18);
    vi.useRealTimers();
  });

  it('올해가 아닌 주는 제목에 연도를 붙인다', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2027, 0, 5));
    render(
      <CalendarNav
        view="week"
        onViewChange={vi.fn()}
        value={new Date(2026, 9, 11)}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('2026년 10월 3주차')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('월별 보기에서는 연·월만 보여주고 화살표가 한 달씩 옮긴다', () => {
    const onChange = vi.fn();
    render(
      <CalendarNav
        view="month"
        onViewChange={vi.fn()}
        value={new Date(2026, 9, 11)}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('2026년 10월')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '이전 달' }));
    expect(onChange.mock.calls[0]?.[0].getMonth()).toBe(8);
  });

  it('보기 전환 버튼은 현재 보기를 눌린 상태로 알리고 누르면 전환을 요청한다', () => {
    const onViewChange = vi.fn();
    render(
      <CalendarNav
        view="week"
        onViewChange={onViewChange}
        value={new Date(2026, 9, 11)}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '주간' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: '월간' }));
    expect(onViewChange).toHaveBeenCalledWith('month');
  });
});
