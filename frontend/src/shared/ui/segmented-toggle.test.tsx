import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedToggle } from './segmented-toggle';

const options = [
  { value: 'mine', label: '내 공연' },
  { value: 'inProgress', label: '진행 중인 공연' },
] as const;

describe('SegmentedToggle', () => {
  it('선택된 옵션을 aria-pressed로 표시한다', () => {
    render(
      <SegmentedToggle
        options={[...options]}
        value="mine"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '내 공연' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('button', { name: '진행 중인 공연' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('다른 옵션 클릭 시 onChange를 호출한다', () => {
    const onChange = vi.fn();
    render(
      <SegmentedToggle
        options={[...options]}
        value="mine"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '진행 중인 공연' }));

    expect(onChange).toHaveBeenCalledWith('inProgress');
  });
});
