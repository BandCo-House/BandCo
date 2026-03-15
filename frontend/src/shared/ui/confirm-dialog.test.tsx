import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  it('열렸을 때 제목과 액션을 렌더링하고 확인 이벤트를 실행한다', () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        open
        title="삭제 확인"
        description="정말 삭제할까요?"
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(screen.getByText('삭제 확인')).toBeInTheDocument();
    expect(screen.getByText('정말 삭제할까요?')).toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
