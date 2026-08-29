import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import CheckIcon from '@/assets/icons/check-mini.svg?react';

import { cn } from '@/shared/lib/utils';

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Round/xs(8px)를 16px 체크박스에 그대로 주면 원형이 되어 고정값을 쓴다.
        'peer size-4 shrink-0 rounded-[4px] border-[1.5px] border-border bg-transparent outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-dark dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center transition-none"
      >
        <CheckIcon className="size-2.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
