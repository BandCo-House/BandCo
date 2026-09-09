import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full transition-colors outline-none disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-key text-key-foreground',
        key: 'bg-key text-key-foreground disabled:cursor-not-allowed disabled:bg-grey-300 disabled:text-grey-500 disabled:opacity-100',
        shining:
          'relative rounded-full bg-primary text-primary-dark shadow-[0_1px_9px_rgba(236,252,171,0.72)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(149deg,rgb(255,255,255)_6.91%,rgba(255,255,255,0)_19.64%)] before:content-[""] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_-2px_-3px_3px_0px_rgba(39,51,31,0.56),inset_0px_-1px_1px_0px_var(--semantic-success-surface)] after:content-[""] disabled:cursor-not-allowed disabled:border disabled:border-white disabled:bg-grey-300 disabled:text-grey-500 disabled:opacity-100 disabled:shadow-none disabled:before:opacity-0 disabled:after:opacity-0',
        // 폼 안쪽 보조 액션(곡 검색·＋링크). shining과 달리 광택/글로우 없이 평평하게 채운다.
        accent:
          'bg-primary text-gradient-top shadow-[0_2px_4px_rgba(255,255,255,0.24)] disabled:cursor-not-allowed disabled:bg-grey-300 disabled:text-grey-500 disabled:opacity-100 disabled:shadow-none',
        neutral:
          'field-border border-grey-50 bg-white/48 text-gradient-bottom typo-base-b disabled:cursor-not-allowed disabled:border-grey-300 disabled:border-b disabled:bg-grey-400 disabled:text-grey-300 disabled:opacity-100',
        disabled:
          'field-border border-white bg-grey-200 text-primary-dark disabled:cursor-not-allowed disabled:bg-grey-300 disabled:text-grey-500 disabled:opacity-100',
        secondary:
          'bg-key text-key-foreground disabled:cursor-not-allowed disabled:bg-grey-300 disabled:text-grey-500 disabled:opacity-100',
        outline: 'field-border border-key-muted bg-transparent text-foreground',
        ghost: 'bg-transparent text-foreground',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'typo-xs-sb h-9 px-3',
        lg: 'typo-lg-b px-5 py-4',
        form: 'typo-lg-b p-5',
        pill: 'px-5 py-4',
        icon: 'size-10',
      },
      width: {
        auto: '',
        fit: 'w-fit',
        flex: 'flex-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      width: 'auto',
    },
  },
);
