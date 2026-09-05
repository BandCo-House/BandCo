import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TagSelectBottomSheet,
  type TagItem,
} from './TagSelectBottomSheet';

const mockItems: TagItem[] = [
  { id: '1', name: '일렉기타' },
  { id: '2', name: '어쿠스틱 기타' },
  { id: '3', name: '보컬' },
  { id: '4', name: '베이스' },
  { id: '5', name: '드럼' },
];

describe('TagSelectBottomSheet', () => {
  it('시트가 열렸을 때 타이틀과 칩 목록을 렌더링하고 선택된 항목에 순번 번호를 매긴다', () => {
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
    expect(screen.getByText('일렉기타')).toBeInTheDocument();
    expect(screen.getByText('어쿠스틱 기타')).toBeInTheDocument();
    expect(screen.getByText('보컬')).toBeInTheDocument();

    // 일렉기타(1번), 보컬(2번) 순번 뱃지 확인
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
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

    // 초기: 1번(일렉기타)만 선택됨
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();

    // '드럼' 클릭 -> 2번으로 선택됨
    const drumChip = screen.getByRole('button', { name: /드럼/i });
    await user.click(drumChip);
    expect(screen.getByText('2')).toBeInTheDocument();

    // '일렉기타' 클릭 -> 선택 해제됨, 드럼이 1번으로 재정렬
    const guitarChip = screen.getByRole('button', { name: /일렉기타/i });
    await user.click(guitarChip);
    expect(screen.getByText('1')).toBeInTheDocument();
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
