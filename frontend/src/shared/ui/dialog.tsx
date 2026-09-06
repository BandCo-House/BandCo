import * as React from 'react';
import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { CloseButtonContent, closeButtonClass } from '@/shared/ui/close-button';
import { GlassRim } from '@/shared/ui/glass-rim';
import { GlowBlob } from '@/shared/ui/glow-blob';

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
        // 바깥 그림자 + 위/아래 안쪽 흰 하이라이트(유리 두께감).
        boxShadow:
          '0 3px 6px 2px rgba(255, 255, 255, 0.16), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.3)',
        ...style,
      }}
      {...props}
    >
      <GlassRim />
      {showGlow && <GlowBlob />}
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
      // 모달 제목 공용 스타일. 시트 제목(sheet.tsx)과 같은 typo-lg-sb를 쓴다.
      className={cn('typo-lg-sb text-grey-100', className)}
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
