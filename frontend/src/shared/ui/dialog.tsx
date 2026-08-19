import * as React from 'react';
import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { CloseButtonContent, closeButtonClass } from '@/shared/ui/close-button';

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  overlayClassName,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  overlayClassName?: string;
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-md border bg-background p-6 shadow-lg duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-6 right-6 rounded-xs text-muted ring-offset-background hover:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent-surface data-[state=open]:text-accent-light [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function AppDialogGlow({ className, ...props }: React.ComponentProps<'svg'>) {
  const gradientId = React.useId();
  const filterId = React.useId();

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 353 678"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
      preserveAspectRatio="none"
      aria-hidden="true"
      {...props}
    >
      <g filter={`url(#${filterId})`}>
        <path
          d="M354.222 684.439C141.51 721.444 -54.6672 585.939 -147.429 541.939C-240.19 497.939 -433.917 1162.65 -127.171 1226.5C179.575 1290.35 904.543 908.945 926.82 537.628C989.673 -510.001 214.544 94.999 345.197 392.771C393.139 502.038 445.738 668.518 354.222 684.439Z"
          fill={`url(#${gradientId})`}
        />
      </g>
      <defs>
        <filter
          id={filterId}
          x="-438.551"
          y="-198.039"
          width={1514}
          height="1576.58"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur stdDeviation="72.5" result="effect1_foregroundBlur" />
        </filter>
        <linearGradient
          id={gradientId}
          x1="3.40972"
          y1={742}
          x2="663.109"
          y2="232.642"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0511104" stopColor="#E1FC73" stopOpacity="0.2" />
          <stop offset="0.853476" stopColor="#E1FC73" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AppDialogContent({
  className,
  children,
  showGlow = true,
  style,
  ...props
}: React.ComponentProps<typeof DialogContent> & {
  showGlow?: boolean;
}) {
  return (
    <DialogContent
      showCloseButton={false}
      overlayClassName="backdrop-blur-none"
      className={cn(
        'overflow-hidden rounded-md border-0 bg-white/24 p-6 text-grey-100 shadow-none backdrop-blur-md',
        className,
      )}
      style={{
        borderStyle: 'solid',
        borderWidth: '0.5px 1px 2px 0.5px',
        borderColor: 'color-mix(in srgb, var(--surface-1) 40%, transparent)',
        boxShadow: '0 3px 6px 2px rgba(255, 255, 255, 0.16)',
        ...style,
      }}
      {...props}
    >
      {showGlow && <AppDialogGlow />}
      {children}
    </DialogContent>
  );
}

function AppDialogClose({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogClose>) {
  return (
    <DialogClose
      type="button"
      className={cn(closeButtonClass, className)}
      {...props}
    >
      {children ?? <CloseButtonContent />}
    </DialogClose>
  );
}

function AppDialogHeader({
  className,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  return (
    <DialogHeader
      className={cn('relative z-10 mb-2 text-left', className)}
      {...props}
    />
  );
}

function AppDialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative z-10 flex flex-col gap-9 text-grey-100',
        className,
      )}
      {...props}
    />
  );
}

function AppDialogFooter({
  className,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  return (
    <DialogFooter
      className={cn('relative z-10 mt-8 items-end', className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      // 모달 제목 공용 스타일(20px/600/140%/grey-100). 20px SemiBold 유틸이 없어 직접 지정.
      className={cn(
        'text-xl leading-[1.4] font-semibold text-grey-100',
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('typo-sm-r text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  AppDialogBody,
  AppDialogClose,
  AppDialogContent,
  AppDialogFooter,
  AppDialogGlow,
  AppDialogHeader,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
