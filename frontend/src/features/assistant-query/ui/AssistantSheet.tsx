import type { ReactNode } from 'react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/shared/ui/sheet';

interface AssistantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 열릴 때 포커스를 줄 요소. 없으면 포커스를 옮기지 않아 키보드가 올라오지 않는다. */
  onOpenFocus?: () => void;
  footer: ReactNode;
  children: ReactNode;
}

/**
 * 질문과 답을 홈 흐름 밖의 전체 화면에서 보여준다.
 * 답이 길어져도 입력창이 하단 탭바 아래로 밀리지 않게 입력창을 하단에 고정한다.
 */
export const AssistantSheet = ({
  open,
  onOpenChange,
  onOpenFocus,
  footer,
  children,
}: AssistantSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side="bottom"
      showCloseButton={false}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        onOpenFocus?.();
      }}
      className="inset-0 mx-auto flex h-full w-full max-w-[648px] flex-col gap-0 border-0 bg-gradient-to-b from-gradient-top to-gradient-bottom p-0 sm:max-w-[648px]"
    >
      <SheetDescription className="sr-only">
        밴드 일정, 참석, 곡, 팀 정보를 자연어로 물어봅니다.
      </SheetDescription>
      <header className="flex items-center gap-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] pr-5 pb-3 pl-2.5">
        <button
          type="button"
          aria-label="뒤로 가기"
          onClick={() => onOpenChange(false)}
          className="inline-flex size-10 items-center justify-center rounded-full text-grey-50 focus-visible:outline-2 focus-visible:outline-key"
        >
          <ArrowRightIcon aria-hidden="true" className="size-6 rotate-180" />
        </button>
        <SheetTitle className="typo-lg-sb text-grey-50">
          밴드에 대해 물어보기
        </SheetTitle>
      </header>
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 pt-2 pb-6">
        {children}
      </div>
      <div className="border-t border-grey-500 px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        {footer}
      </div>
    </SheetContent>
  </Sheet>
);
