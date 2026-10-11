import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MonthDatePicker } from './month-date-picker';

describe('MonthDatePicker', () => {
  it('선택한 날짜가 속한 달 전체를 보여주고 선택한 날짜를 강조한다', () => {
    render(
      <MonthDatePicker value={new Date(2026, 9, 11)} onChange={vi.fn()} />,
    );

    expect(
      screen.getByRole('button', { name: '10월 1일 목요일' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '10월 31일 토요일' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '10월 11일 일요일' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('날짜를 누르면 그 날짜로 onChange를 호출한다', () => {
    const onChange = vi.fn();
    render(
      <MonthDatePicker value={new Date(2026, 9, 11)} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: '10월 20일 화요일' }));

    expect(onChange.mock.calls[0]?.[0].getDate()).toBe(20);
  });

  it('항목이 있는 날은 개수를 이름에 담아 점의 뜻을 스크린리더에도 전한다', () => {
    render(
      <MonthDatePicker
        value={new Date(2026, 9, 11)}
        onChange={vi.fn()}
        markers={new Map([['2026-10-10', 3]])}
        markerLabel="일정"
      />,
    );

    expect(
      screen.getByRole('button', { name: '10월 10일 토요일, 일정 3개' }),
    ).toBeInTheDocument();
  });
});
