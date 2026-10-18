import { cn } from '@/shared/lib/utils';

interface SuggestionChipProps {
  label: string;
  onSelect: () => void;
  /** 접근성 이름이 칩 글자와 다를 때(짧은 라벨로 긴 질문을 보낼 때) 쓴다. */
  ariaLabel?: string;
  emphasized?: boolean;
}

/** 누르면 바로 물어보는 질문 칩. 일정 필터 칩과 같은 모양을 쓴다. */
export const SuggestionChip = ({
  label,
  onSelect,
  ariaLabel,
  emphasized,
}: SuggestionChipProps) => (
  <button
    type="button"
    onClick={onSelect}
    aria-label={ariaLabel}
    className={cn(
      'rounded-full border bg-grey-500/24 px-4 py-2 text-left typo-xs-sb transition-colors',
      emphasized
        ? 'border-primary text-primary'
        : 'border-grey-400 text-grey-100',
    )}
  >
    {label}
  </button>
);
