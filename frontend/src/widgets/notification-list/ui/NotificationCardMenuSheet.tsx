import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import type { NotificationItem } from '@/entities/notification/model/types';
import { GlowBlob } from '@/shared/ui/glow-blob';

type NotificationCardMenuSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  noti: NotificationItem;
  onDelete: () => void;
  onMarkAsRead: () => void;
};

export const NotificationCardMenuSheet = ({
  isOpen,
  onOpenChange,
  noti,
  onDelete,
  onMarkAsRead,
}: NotificationCardMenuSheetProps) => {
  const isInvite = noti.type === 'INVITE';

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    onOpenChange(false);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead();
    onOpenChange(false);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        className="fixed inset-x-4 top-auto bottom-6 z-50 mx-auto flex h-auto w-[calc(100%-2rem)] max-w-[608px] animate-none! flex-col gap-2 border-0 bg-transparent p-0 shadow-none transition-none! duration-0 outline-none"
        showCloseButton={false}
      >
        {/* Card 1: Actions (거절하기/삭제하기 & 읽음 처리) */}
        <div className="relative flex w-full flex-col overflow-hidden rounded-[20px] border border-b-[2px] border-[rgba(220,226,249,0.4)] bg-white/24 p-0 shadow-[0_3px_6px_2px_rgba(255,255,255,0.16)] backdrop-blur-[20px]">
          {/* Glow Background */}
          <GlowBlob className="absolute -top-[500px] right-auto bottom-auto left-0 h-[678px] w-full" />
          {/* Hidden Header for Accessibility */}
          <SheetHeader className="sr-only">
            <SheetTitle>알림 옵션</SheetTitle>
          </SheetHeader>

          {/* Action 1: 거절하기 / 삭제하기 */}
          <button
            type="button"
            onClick={handleAction}
            className="relative z-10 flex h-[60px] w-full cursor-pointer items-center justify-center border-b border-white/10 text-center text-xl leading-7 font-semibold text-[#DFDFE1] transition-colors hover:bg-white/5 active:bg-white/10"
          >
            <span className="relative z-10">
              {isInvite ? '거절하기' : '삭제하기'}
            </span>
          </button>

          {/* Action 2: 읽음 처리 */}
          <button
            type="button"
            disabled={noti.isRead || isInvite}
            onClick={handleMarkAsRead}
            className={`relative z-10 flex h-[60px] w-full items-center justify-center text-center text-xl leading-7 font-semibold transition-colors ${
              noti.isRead || isInvite
                ? 'cursor-not-allowed text-[#DFDFE1]/40'
                : 'cursor-pointer text-[#DFDFE1] hover:bg-white/5 active:bg-white/10'
            }`}
          >
            <span className="relative z-10">읽음 처리</span>
          </button>
        </div>

        {/* Card 2: Cancel / 이전 */}

        <button
          type="button"
          onClick={handleClose}
          className="relative flex h-[60px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[20px] border border-b-[2px] border-[rgba(220,226,249,0.4)] bg-white/24 text-xl leading-7 font-semibold text-[#DFDFE1] shadow-[0_3px_6px_2px_rgba(255,255,255,0.16)] backdrop-blur-[20px] transition-colors hover:bg-white/5 active:bg-white/10"
        >
          <span className="relative z-10">이전</span>
          {/* Glow Background */}
          <GlowBlob className="absolute -top-[550px] right-auto bottom-auto left-0 h-[678px] w-full" />
        </button>
      </SheetContent>
    </Sheet>
  );
};
