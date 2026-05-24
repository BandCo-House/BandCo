import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/shared/lib/utils';
import { buttonVariants } from './button-variants';

interface ButtonProps
  extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingContent?: React.ReactNode;
}

/**
 * 외부 className에 타이포그래피 유틸이 있으면 버튼 기본 타이포그래피 유틸을 제거한다.
 */
const resolveButtonClassName = (
  variantClassName: string,
  className?: string,
) => {
  if (!className || !/(^|\s)typo-\S+/.test(className)) {
    return cn(variantClassName, className);
  }

  return cn(variantClassName.replace(/(^|\s)typo-\S+/g, ' '), className);
};

// isLoading=true일 때는 항상 <button> 태그로 렌더링 (asChild 무시)
function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  isLoading = false,
  loadingContent,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild && !isLoading ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={isLoading || disabled}
      className={resolveButtonClassName(
        buttonVariants({ variant, size }),
        className,
      )}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {isLoading
          ? (loadingContent ?? <Loader2 className="h-4 w-4 animate-spin" />)
          : children}
      </span>
    </Comp>
  );
}

export { Button };
export type { ButtonProps };
