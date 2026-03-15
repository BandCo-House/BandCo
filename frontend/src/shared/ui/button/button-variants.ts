import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  {
  variants: {
    variant: {
        default:
          'bg-primary text-primary-foreground text-secondary-surface',
        outline:
          'border border-primary-light bg-transparent text-foreground',
        ghost: 'bg-transparent text-foreground',
    },
    size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-5 text-sm',
        icon: 'size-10',
    },
  },
  defaultVariants: {
      variant: 'default',
      size: 'default',
  },
  },
);
