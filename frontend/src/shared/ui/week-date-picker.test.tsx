import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeekDatePicker, WeekDateStrip } from './week-date-picker';

describe('WeekDatePicker', () => {
  it('선택한 날짜의 연·월을 표시한다', () => {
    render(
      <WeekDatePicker
        value={new Date('2026-06-07T00:00:00')}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('2026년 6월')).toBeInTheDocument();
  });

  it('다음 주/이전 주 화살표는 7일 단위로 이동한다', () => {
    const onChange = vi.fn();
    render(
      <WeekDatePicker
        value={new Date('2026-06-07T00:00:00')}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '다음 주' }));
    expect(onChange.mock.calls[0]?.[0].getDate()).toBe(14);

    fireEvent.click(screen.getByRole('button', { name: '이전 주' }));
    expect(onChange.mock.calls[1]?.[0].getDate()).toBe(31); // 5월 31일
  });

  it('날짜 셀 클릭 시 해당 날짜로 onChange를 호출한다', () => {
    const onChange = vi.fn();
    render(
      <WeekDatePicker
        value={new Date('2026-06-07T00:00:00')}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '6월 9일' }));
    expect(onChange.mock.calls[0]?.[0].getDate()).toBe(9);
  });

  it('주 보기에서도 일정이 있는 날은 이름에 일정 수를 붙여 알린다', () => {
    render(
      <WeekDateStrip
        value={new Date('2026-06-07T00:00:00')}
        onChange={vi.fn()}
        markers={new Map([['2026-06-09', 2]])}
        markerLabel="일정"
      />,
    );

    expect(
      screen.getByRole('button', { name: '6월 9일 일정 2개' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '6월 10일' }),
    ).toBeInTheDocument();
  });
});
