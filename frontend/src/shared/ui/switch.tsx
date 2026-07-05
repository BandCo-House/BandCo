import { cn } from '@/shared/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/**
 * 온오프 토글 스위치. Radix 없이 button[role=switch]로 구현한다.
 * 상태는 위치(왼/오른쪽) + 색으로 함께 전달한다.
 */
export const Switch = ({
  checked,
  onCheckedChange,
  id,
  disabled,
  className,
  ...aria
}: SwitchProps) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    aria-label={aria['aria-label']}
    aria-labelledby={aria['aria-labelledby']}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full bg-white/24 p-1 transition-colors',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-key',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
  >
    <span
      aria-hidden="true"
      className={cn(
        'size-6 rounded-full transition-transform',
        checked ? 'translate-x-6 bg-primary' : 'translate-x-0 bg-grey-300',
      )}
    />
  </button>
);
