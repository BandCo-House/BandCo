import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { WheelDate } from '@/shared/ui/wheel-date';
import { SpacePeriodPicker } from './SpacePeriodPicker';

const Harness = ({ hasEnd = true }: { hasEnd?: boolean }) => {
  const [period, setPeriod] = useState<{
    startDate: WheelDate;
    endDate: WheelDate;
  }>({
    startDate: { year: 2026, month: 11, day: 9 },
    endDate: { year: 2026, month: 11, day: 9 },
  });
  return (
    <SpacePeriodPicker
      startDate={period.startDate}
      endDate={period.endDate}
      hasEnd={hasEnd}
      onChange={setPeriod}
    />
  );
};

const day = (label: RegExp) => screen.getByRole('button', { name: label });

describe('SpacePeriodPicker', () => {
  it('시작을 고르면 종료로 넘어가, 두 번 눌러 기간을 정한다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(day(/^11월 12일/));
    expect(screen.getByRole('button', { name: /^종료 날짜/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(day(/^11월 20일/));
    expect(
      screen.getByRole('button', { name: /^시작 날짜 (2026년 )?11월 12일/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^종료 날짜 (2026년 )?11월 20일/ }),
    ).toBeInTheDocument();
    // 그 사이 날짜도 기간으로 칠해진다.
    expect(day(/^11월 15일/)).toHaveAttribute('aria-pressed', 'true');
  });

  it('종료를 고를 때 시작보다 앞선 날은 고를 수 없다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(day(/^11월 12일/));

    expect(day(/^11월 10일/)).toBeDisabled();
  });

  it('종료가 없는 합주는 시작 하루만 고른다', async () => {
    const user = userEvent.setup();
    render(<Harness hasEnd={false} />);

    await user.click(day(/^11월 12일/));

    expect(screen.queryByRole('button', { name: /^종료 날짜/ })).toBeNull();
    expect(screen.getByText('정해진 기간 없음')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^시작 날짜 (2026년 )?11월 12일/ }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
