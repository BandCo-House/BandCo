import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { Search } from 'lucide-react';

const inputVariantClassNames = {
  roundedFull:
    'rounded-full border bg-transparent p-4 outline-solid outline-1 outline-transparent hover:outline-secondary focus-visible:outline-2 focus-visible:outline-secondary',
  underline:
    'rounded-none border-0 border-b bg-transparent px-0 py-3 outline-none hover:border-secondary focus-visible:border-secondary focus-visible:ring-0',
} as const;

type InputProps = React.ComponentProps<'input'> & {
  /**
   * 검색 입력 스타일을 적용한다.
   * true이면 좌측 검색 아이콘이 렌더링된다.
   */
  isSearchBar?: boolean;
  /**
   * 입력 필드의 시각적 변형을 지정한다.
   * roundedFull은 둥근 캡슐형, underline은 밑줄형 입력을 렌더링한다.
   */
  variant?: keyof typeof inputVariantClassNames;
};

/**
 * 공용 입력 필드를 렌더링한다.
 * 검색 입력과 인증 화면 입력 변형을 같은 접근성 규칙으로 제공한다.
 */
const Input = ({
  className,
  type,
  isSearchBar = false,
  variant = 'roundedFull',
  ...props
}: InputProps) => {
  const hasAccessibleName = Boolean(
    props['aria-label'] || props['aria-labelledby'],
  );
  const defaultSearchAriaLabel =
    typeof props.placeholder === 'string' && props.placeholder.trim().length > 0
      ? props.placeholder
      : 'Search';
  const inputProps =
    isSearchBar && !hasAccessibleName
      ? { ...props, 'aria-label': defaultSearchAriaLabel }
      : props;

  const inputElement = (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-sm file:font-medium file:text-foreground text-grey-50 placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-border w-full transition-[border-color,color,box-shadow,outline-color,outline-width] file:inline-flex file:h-7 file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed',
        inputVariantClassNames[variant],
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive aria-invalid:outline-destructive',
        isSearchBar && 'pl-11',
        className,
      )}
      {...inputProps}
    />
  );

  if (!isSearchBar) return inputElement;

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 placeholder:text-muted-foreground" />
      {inputElement}
    </div>
  );
};

export { Input };
