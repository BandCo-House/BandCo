import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

/** 여러 줄 입력. 일정 메모·신고 상세처럼 폼 안의 자유 서술 칸에 쓴다. */
export const Textarea = ({
  className,
  ...props
}: ComponentProps<'textarea'>) => (
  <textarea
    data-slot="textarea"
    className={cn(
      'min-h-[100px] w-full resize-none rounded-md field-border border-white/24 bg-grey-500/24 px-5 py-4 typo-base-sb text-grey-50',
      'outline-none placeholder:text-grey-300 focus-visible:border-primary',
      className,
    )}
    {...props}
  />
);
