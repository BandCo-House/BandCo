import type { ReactNode, RefObject } from 'react';
import {
  AppSheetClose,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/shared/ui/sheet';

interface AssistantScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  footer: ReactNode;
  children: ReactNode;
}

/**
 * 질문과 답을 대화처럼 쌓아 보여주는 전체 화면. 아래에서 올라오며 하단 탭바와 고정 헤더를 모두 덮는다.
 * 입력창은 하단에 고정해 답이 길어져도 밀리지 않는다.
 */
export const AssistantScreen = ({
  open,
  onOpenChange,
  scrollRef,
  footer,
  children,
}: AssistantScreenProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side="bottom"
      showCloseButton={false}
      // 열자마자 키보드가 올라와 답을 가리지 않게 포커스를 옮기지 않는다.
      onOpenAutoFocus={(event) => event.preventDefault()}
      className="inset-0 z-[60] block h-dvh w-full max-w-none gap-0 border-0 bg-gradient-to-b from-gradient-top to-gradient-bottom p-0 sm:max-w-none"
    >
      {/* 바탕은 화면 전체를 덮고 내용만 앱 폭(648)으로 가운데 둔다. PC에서 스크롤 잠금으로 가운데가 어긋나도 뒤 화면이 보이지 않는다. */}
      <div className="mx-auto flex h-full w-full max-w-[648px] flex-col">
        <SheetDescription className="sr-only">
          밴드 일정, 참석, 곡, 팀 정보를 물어보고 답을 봅니다.
        </SheetDescription>
        <header className="flex items-center justify-between gap-3 border-b border-grey-500 px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
          <SheetTitle className="typo-lg-sb text-grey-50">
            밴드에 대해 물어보기
          </SheetTitle>
          <AppSheetClose aria-label="닫기" />
        </header>
        <div
          ref={scrollRef}
          className="flex flex-1 flex-col gap-8 overflow-y-auto scroll-smooth px-5 pt-4 pb-6"
        >
          {children}
        </div>
        <div className="border-t border-grey-500 px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          {footer}
        </div>
      </div>
    </SheetContent>
  </Sheet>
);
