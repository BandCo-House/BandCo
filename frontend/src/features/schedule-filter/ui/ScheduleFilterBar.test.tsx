import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ScheduleFilterBar } from './ScheduleFilterBar';

const setup = (overrides?: {
  scheduleType?: 'PRACTICE' | 'MEETING';
  onlyMine?: boolean;
}) => {
  const onScheduleTypeChange = vi.fn();
  const onOnlyMineChange = vi.fn();
  render(
    <ScheduleFilterBar
      scheduleType={overrides?.scheduleType}
      onScheduleTypeChange={onScheduleTypeChange}
      onlyMine={overrides?.onlyMine ?? false}
      onOnlyMineChange={onOnlyMineChange}
    />,
  );
  return { onScheduleTypeChange, onOnlyMineChange };
};

describe('ScheduleFilterBar', () => {
  it('유형 칩을 누르면 해당 값으로 변경을 알린다', async () => {
    const user = userEvent.setup();
    const { onScheduleTypeChange } = setup();

    await user.click(screen.getByRole('button', { name: '합주' }));
    expect(onScheduleTypeChange).toHaveBeenCalledWith('PRACTICE');

    await user.click(screen.getByRole('button', { name: '회의' }));
    expect(onScheduleTypeChange).toHaveBeenCalledWith('MEETING');
  });

  it('선택된 유형 칩은 aria-pressed로 상태를 노출한다', () => {
    setup({ scheduleType: 'MEETING' });

    expect(screen.getByRole('button', { name: '회의' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('"내가 포함된 일정만 보기" 토글을 알린다', async () => {
    const user = userEvent.setup();
    const { onOnlyMineChange } = setup();

    await user.click(screen.getByLabelText('내가 포함된 일정만 보기'));
    expect(onOnlyMineChange).toHaveBeenCalledWith(true);
  });
});
