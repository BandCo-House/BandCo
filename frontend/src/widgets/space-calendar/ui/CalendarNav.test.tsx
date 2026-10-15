import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CalendarNav } from './CalendarNav';

describe('CalendarNav', () => {
  it('주별 보기에서는 주차까지 제목에 보여주고 화살표가 7일씩 옮긴다', () => {
    const onChange = vi.fn();
    render(
      <CalendarNav
        view="week"
        onViewChange={vi.fn()}
        value={new Date(2026, 9, 11)}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('2026년 10월 3주차')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다음 주' }));
    expect(onChange.mock.calls[0]?.[0].getDate()).toBe(18);
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

    expect(screen.getByRole('button', { name: '주별 보기' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: '월별 보기' }));
    expect(onViewChange).toHaveBeenCalledWith('month');
  });
});
