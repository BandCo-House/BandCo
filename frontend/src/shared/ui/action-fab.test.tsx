import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionFab } from './action-fab';

describe('ActionFab', () => {
  it('글자가 보이는 버튼을 누르면 메뉴 없이 바로 행동을 실행한다', () => {
    const onClick = vi.fn();
    render(<ActionFab label="새 합주" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: '새 합주' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('hidden이면 렌더하지 않는다', () => {
    render(<ActionFab label="새 합주" onClick={vi.fn()} hidden />);

    expect(screen.queryByRole('button', { name: '새 합주' })).toBeNull();
  });
});
