import * as React from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

type InputProps = React.ComponentProps<'input'> & {
  /**
   * 검색 입력 스타일을 적용한다.
   * true이면 좌측 검색 아이콘이 렌더링된다.
   */
  isSearchBar?: boolean;
};

/**
 * Base input component with optional search-bar mode.
 */
function Input({ className, type, isSearchBar = false, ...props }: InputProps) {
  const hasAccessibleName = Boolean(props['aria-label'] || props['aria-labelledby']);
  const defaultSearchAriaLabel =
    typeof props.placeholder === 'string' && props.placeholder.trim().length > 0
      ? props.placeholder
      : 'Search';
  const inputProps =
    isSearchBar && !hasAccessibleName ? { ...props, 'aria-label': defaultSearchAriaLabel } : props;

  const inputElement = (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full rounded-md border bg-transparent px-3 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        isSearchBar && 'pl-9',
        className,
      )}
      {...inputProps}
    />
  );

  if (!isSearchBar) return inputElement;

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      {inputElement}
    </div>
  );
}

export { Input };
