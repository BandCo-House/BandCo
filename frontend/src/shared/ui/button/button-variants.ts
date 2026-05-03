import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  {
  variants: {
    variant: {
        default:
          'bg-primary text-primary-foreground',
        secondary:
          'bg-secondary text-secondary-foreground disabled:cursor-not-allowed disabled:bg-grey-300 disabled:text-grey-500 disabled:opacity-100',
        outline:
          'border border-primary-light bg-transparent text-foreground',
        ghost: 'bg-transparent text-foreground',
    },
    size: {
        default: 'h-11 px-4 py-2',
        sm: 'typo-xs-sb h-9 px-3',
        lg: 'typo-lg-b p-5',
        icon: 'size-10',
    },
  },
  defaultVariants: {
      variant: 'default',
      size: 'default',
  },
  },
);
