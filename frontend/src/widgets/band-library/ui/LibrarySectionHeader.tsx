import AddIcon from '@/assets/icons/add.svg?react';

interface LibrarySectionHeaderProps {
  title: string;
  /** 추가 버튼 aria-label (아이콘 전용 버튼이라 필수). */
  addLabel: string;
  onAdd?: () => void;
}

/**
 * 라이브러리 섹션 제목 + 추가(+) 버튼. 합주곡/연습 장소 섹션이 공유한다.
 */
export const LibrarySectionHeader = ({
  title,
  addLabel,
  onAdd,
}: LibrarySectionHeaderProps) => (
  <div className="flex items-center gap-3">
    <h2 className="min-w-0 flex-1 typo-lg-sb text-grey-50">{title}</h2>
    <button
      type="button"
      aria-label={addLabel}
      onClick={onAdd}
      className="flex shrink-0 items-center p-2 text-grey-50 outline-none focus-visible:outline-2 focus-visible:outline-key"
    >
      <AddIcon aria-hidden="true" className="size-6" />
    </button>
  </div>
);
