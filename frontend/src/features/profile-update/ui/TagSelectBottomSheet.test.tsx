import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagSelectBottomSheet, type TagItem } from './TagSelectBottomSheet';

const mockItems: TagItem[] = [
  { id: '1', name: '일렉기타' },
  { id: '2', name: '어쿠스틱 기타' },
  { id: '3', name: '보컬' },
  { id: '4', name: '베이스' },
  { id: '5', name: '드럼' },
];

describe('TagSelectBottomSheet', () => {
  it('시트가 열렸을 때 칩 목록을 렌더링하고, 첫 선택은 핀·나머지는 2부터 번호를 매긴다', () => {
    render(
      <TagSelectBottomSheet
        open={true}
        onOpenChange={vi.fn()}
        title="플레이 파트"
        items={mockItems}
        selectedIds={['1', '3']}
      />,
    );

    expect(screen.getByText('플레이 파트')).toBeInTheDocument();
    expect(screen.getByText('어쿠스틱 기타')).toBeInTheDocument();

    // 1번 자리는 핀이 대신하므로 번호는 2부터 시작한다.
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /일렉기타/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('description을 주면 제목 아래에 보이고, 주지 않으면 화면에서 감춘다', () => {
    const { unmount } = render(
      <TagSelectBottomSheet
        open={true}
        onOpenChange={vi.fn()}
        title="플레이 파트"
        description="핀 표시가 대표 파트가 되고, 나머지는 번호순으로 프로필에 보여요."
        items={mockItems}
        selectedIds={['1']}
      />,
    );

    expect(
      screen.getByText(
        '핀 표시가 대표 파트가 되고, 나머지는 번호순으로 프로필에 보여요.',
      ),
    ).toBeVisible();
    unmount();

    render(
      <TagSelectBottomSheet
        open={true}
        onOpenChange={vi.fn()}
        title="선호 장르"
        items={mockItems}
        selectedIds={['1']}
      />,
    );

    // 없으면 Radix가 요구하는 설명은 sr-only로만 남는다(스크린리더용).
    expect(screen.getByText('선호 장르 선택 바텀시트')).toHaveClass('sr-only');
  });

  it('미선택 칩을 누르면 선택되어 다음 번호가 매겨지고, 선택된 칩을 누르면 해제된다', async () => {
    const user = userEvent.setup();
    render(
      <TagSelectBottomSheet
        open={true}
        onOpenChange={vi.fn()}
        title="플레이 파트"
        items={mockItems}
        selectedIds={['1']}
      />,
    );

    // 초기: 일렉기타만 선택 — 대표라 번호 없이 핀만 붙는다
    const guitarChip = screen.getByRole('button', { name: /일렉기타/i });
    expect(guitarChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('2')).not.toBeInTheDocument();

    // '드럼' 클릭 -> 두 번째 선택이라 2번
    const drumChip = screen.getByRole('button', { name: /드럼/i });
    await user.click(drumChip);
    expect(screen.getByText('2')).toBeInTheDocument();

    // '일렉기타' 해제 -> 드럼이 대표로 올라가 번호가 사라진다
    await user.click(guitarChip);
    expect(guitarChip).toHaveAttribute('aria-pressed', 'false');
    expect(drumChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('시트가 닫힐 때 변경사항이 있으면 onSave가 호출된다', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    const handleOpenChange = vi.fn();

    render(
      <TagSelectBottomSheet
        open={true}
        onOpenChange={handleOpenChange}
        title="선호 장르"
        items={mockItems}
        selectedIds={['1']}
        onSave={handleSave}
      />,
    );

    // '보컬' 선택
    const vocalChip = screen.getByRole('button', { name: /보컬/i });
    await user.click(vocalChip);

    // 닫기 (X 버튼 클릭)
    const closeButton = screen.getByRole('button', { name: /닫기|close/i });
    await user.click(closeButton);

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave).toHaveBeenCalledWith(['1', '3']);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('변경사항 없이 닫히면 onSave가 호출되지 않는다', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    const handleOpenChange = vi.fn();

    render(
      <TagSelectBottomSheet
        open={true}
        onOpenChange={handleOpenChange}
        title="선호 장르"
        items={mockItems}
        selectedIds={['1']}
        onSave={handleSave}
      />,
    );

    // 아무것도 선택하지 않고 닫기 클릭
    const closeButton = screen.getByRole('button', { name: /닫기|close/i });
    await user.click(closeButton);

    expect(handleSave).not.toHaveBeenCalled();
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('외부에서 selectedIds가 변경된 후 시트가 열리고 변경 없이 닫히면 이전 값이 저장되지 않는다 (회귀 방지)', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    const handleOpenChange = vi.fn();

    // 1. 처음에는 ['1', '2']로 닫혀있는 상태로 렌더링
    const { rerender } = render(
      <TagSelectBottomSheet
        open={false}
        onOpenChange={handleOpenChange}
        title="플레이 파트"
        items={mockItems}
        selectedIds={['1', '2']}
        onSave={handleSave}
      />,
    );

    // 2. 외부에서 2번이 삭제되어 selectedIds가 ['1']로 바뀌고 시트가 열림 (open=true)
    rerender(
      <TagSelectBottomSheet
        open={true}
        onOpenChange={handleOpenChange}
        title="플레이 파트"
        items={mockItems}
        selectedIds={['1']}
        onSave={handleSave}
      />,
    );

    // 3. 아무 변경 없이 닫기 클릭
    const closeButton = screen.getByRole('button', { name: /닫기|close/i });
    await user.click(closeButton);

    // 4. 이전 값인 ['1', '2']가 다시 저장되지 않아야 함
    expect(handleSave).not.toHaveBeenCalled();
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
