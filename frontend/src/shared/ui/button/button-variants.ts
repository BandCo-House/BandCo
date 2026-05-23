import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-key text-key-foreground',
        key: 'bg-key text-key-foreground disabled:cursor-not-allowed disabled:bg-grey-300 disabled:text-grey-500 disabled:opacity-100',
        shining:
          'relative rounded-[var(--Round-full)] border-t-[0.5px] border-r-[0.5px] border-b-[0.5px] border-l border-t-white border-r-white border-b-white border-l-white bg-main-main text-primary-dark shadow-[inset_-1px_-1px_1px_0_rgba(39,51,31,0.56),inset_0_-1px_1px_0_var(--semantic-success-surface),0_1px_12px_6px_rgba(236,252,171,0.42)] disabled:cursor-not-allowed disabled:border-white disabled:bg-grey-300 disabled:text-grey-500 disabled:shadow-none disabled:opacity-100',
        neutral:
          'border border-white bg-grey-200 text-primary-dark disabled:cursor-not-allowed disabled:bg-grey-300 disabled:text-grey-500 disabled:opacity-100',
        secondary:
          'bg-key text-key-foreground disabled:cursor-not-allowed disabled:bg-grey-300 disabled:text-grey-500 disabled:opacity-100',
        outline: 'border border-key-muted bg-transparent text-foreground',
        ghost: 'bg-transparent text-foreground',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'typo-xs-sb h-9 px-3',
        lg: 'typo-lg-b p-5',
        form: 'typo-lg-b p-5',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);
