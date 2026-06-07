import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpeedDialFab } from './speed-dial-fab';

describe('SpeedDialFab', () => {
  it('메뉴 버튼으로 펼치고 접으며 aria-expanded를 반영한다', () => {
    render(
      <SpeedDialFab mainLabel="메뉴 열기" actions={[{ label: '새 합주' }]} />,
    );

    const main = screen.getByRole('button', { name: '메뉴 열기' });
    expect(main).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(main);
    expect(screen.getByRole('button', { name: '메뉴 닫기' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('액션 클릭 시 해당 핸들러를 호출한다', () => {
    const onClick = vi.fn();
    render(
      <SpeedDialFab
        mainLabel="메뉴 열기"
        actions={[{ label: '새 합주', onClick }]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }));
    fireEvent.click(screen.getByRole('button', { name: '새 합주' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
