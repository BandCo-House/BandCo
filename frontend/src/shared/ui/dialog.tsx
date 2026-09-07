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

// 유리 카드의 테두리 선. 실제 border가 아니라 inset ring으로 그린다 — 이유는 아래.
const RIM_COLOR = 'color-mix(in srgb, var(--surface-1) 40%, transparent)';

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
        // 높이 제한과 flex 세로 배치는 기본값이다. 이게 없으면 내용이 뷰포트보다
        // 길어질 때 overflow-hidden에 잘려 나가고 스크롤도 안 돼, 아래쪽 CTA에
        // 아예 손이 닿지 않는다(예: 360x568에서 커버를 고른 밴드 만들기).
        // 스크롤은 AppDialogBody가 맡는다.
        //
        // 패딩 20은 화면별로 덮어쓰지 않는다. 이전 기본값 24는 shadcn에서 물려받은
        // 값이라 아무도 고른 적이 없었고, 그래서 모달마다 20·32로 제각각
        // 오버라이드하며 피해 다녔다(4종류).
        // 하단을 32로 키우지 않는 이유: 푸터 간격은 AppDialogFooter의 mt-8이 맡는다.
        'flex max-h-[85dvh] flex-col overflow-hidden rounded-md border-0 bg-white/24 p-5 text-grey-100 shadow-none backdrop-blur-md',
        className,
      )}
      style={{
        // 테두리를 실제 border로 그리면 border box와 padding box가 어긋난다.
        // GlassRim·GlowBlob은 inset-0이라 padding box까지만 깔리므로, 그 사이
        // 0.5~2px 링에는 글로우가 닿지 않는다. 그 링만 색이 달라 카드 사방에
        // 얇은 막이 덧대인 것처럼 보였다(오른쪽·아래가 두꺼워 제일 눈에 띔).
        // 같은 두께를 inset ring으로 옮기면 두 박스가 일치해 틈이 사라진다.
        boxShadow: [
          // 바깥 그림자 + 위/아래 안쪽 흰 하이라이트(유리 두께감).
          '0 3px 6px 2px rgba(255, 255, 255, 0.16)',
          'inset 0 1px 0 rgba(255,255,255,0.6)',
          'inset 0 -1px 0 rgba(255,255,255,0.3)',
          // 아래·오른쪽을 두껍게 둔 비대칭 테두리(빛이 좌상단에서 온다).
          `inset 0 0.5px 0 0 ${RIM_COLOR}`,
          `inset -1px 0 0 0 ${RIM_COLOR}`,
          `inset 0 -2px 0 0 ${RIM_COLOR}`,
          `inset 0.5px 0 0 0 ${RIM_COLOR}`,
        ].join(', '),
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

/**
 * 모달 헤더. 제목과 닫기(X)를 한 줄에 놓는다.
 * 닫기를 흐름에 두므로 콘텐츠 패딩이 얼마든 좌우 그리드가 저절로 맞는다.
 */
function AppDialogHeader({
  className,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  return (
    <DialogHeader
      className={cn(
        'relative z-10 mb-2 flex shrink-0 flex-row items-start justify-between gap-4 text-left',
        className,
      )}
      {...props}
    />
  );
}

function AppDialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        // min-h-0가 있어야 flex 자식이 실제로 줄어들며 스크롤이 생긴다.
        'relative z-10 flex min-h-0 flex-1 flex-col gap-9 overflow-y-auto text-grey-100',
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
      className={cn('relative z-10 mt-8 shrink-0 items-end', className)}
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
      // index.css 타이포 스케일에서 24는 "페이지·모달·상세 제목" 자리다.
      // 18을 쓰면 바로 아래 섹션 라벨(밴드 이름·밴드 커버…)과 같은 크기가 되어
      // 제목이 목록의 한 항목처럼 읽힌다. 시트 제목은 앱바에 가까워 18을 유지한다.
      className={cn('typo-xl-sb text-grey-100', className)}
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
