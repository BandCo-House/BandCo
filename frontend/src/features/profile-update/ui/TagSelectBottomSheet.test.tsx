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
  it('시트가 열렸을 때 타이틀·안내 문구·칩 목록을 렌더링하고, 첫 선택에만 대표 라벨을 단다', () => {
    render(
      <TagSelectBottomSheet
        open={true}
        onOpenChange={vi.fn()}
        title="플레이 파트"
        description="가장 먼저 고른 파트가 대표 파트가 돼요."
        primaryLabel="대표"
        items={mockItems}
        selectedIds={['1', '3']}
      />,
    );

    expect(screen.getByText('플레이 파트')).toBeInTheDocument();
    expect(
      screen.getByText('가장 먼저 고른 파트가 대표 파트가 돼요.'),
    ).toBeInTheDocument();
    expect(screen.getByText('어쿠스틱 기타')).toBeInTheDocument();

    // 첫 선택(일렉기타)에만 '대표'. 2번째 선택(보컬)은 라벨 없이 선택 상태만 갖는다 —
    // 저장되는 건 isPrimary(첫 번째)뿐이라 없는 순위를 보여주지 않는다.
    expect(screen.getAllByText('대표')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /일렉기타/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /보컬/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('primaryLabel을 주지 않으면(장르처럼 대표 개념이 없으면) 아무 라벨도 달지 않는다', () => {
    render(
      <TagSelectBottomSheet
        open={true}
        onOpenChange={vi.fn()}
        title="선호 장르"
        items={mockItems}
        selectedIds={['1', '3']}
      />,
    );

    expect(screen.queryByText('대표')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /일렉기타/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('미선택 칩을 누르면 선택되고, 첫 선택을 해제하면 대표가 다음 항목으로 넘어간다', async () => {
    const user = userEvent.setup();
    render(
      <TagSelectBottomSheet
        open={true}
        onOpenChange={vi.fn()}
        title="플레이 파트"
        primaryLabel="대표"
        items={mockItems}
        selectedIds={['1']}
      />,
    );

    const guitarChip = screen.getByRole('button', { name: /일렉기타/i });
    const drumChip = screen.getByRole('button', { name: /드럼/i });
    expect(guitarChip).toHaveAttribute('aria-pressed', 'true');
    expect(drumChip).toHaveAttribute('aria-pressed', 'false');

    // 드럼 추가 — 두 번째 선택이라 대표 라벨은 여전히 일렉기타 하나뿐
    await user.click(drumChip);
    expect(drumChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText('대표')).toHaveLength(1);
    expect(guitarChip).toContainElement(screen.getByText('대표'));

    // 일렉기타 해제 — 대표가 드럼으로 넘어간다(저장 시 isPrimary도 같이 이동)
    await user.click(guitarChip);
    expect(guitarChip).toHaveAttribute('aria-pressed', 'false');
    expect(drumChip).toContainElement(screen.getByText('대표'));
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
