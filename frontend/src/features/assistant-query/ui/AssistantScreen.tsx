import type { ReactNode, RefObject } from 'react';
import { Button } from '@/shared/ui/button';
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
  /** 주면 머리에 새 대화 버튼을 둔다. 대화가 비어 있으면 넘기지 않는다. */
  onStartNew?: () => void;
  footer: ReactNode;
  children: ReactNode;
}

/**
 * 질문과 답을 대화처럼 쌓아 보여주는 전체 화면. 아래에서 올라오며 하단 탭바와 고정 헤더를 모두 덮는다.
 * 입력창은 하단에 고정해 답이 길어져도 밀리지 않는다. 닫아도 대화는 남는다.
 */
export const AssistantScreen = ({
  open,
  onOpenChange,
  scrollRef,
  onStartNew,
  footer,
  children,
}: AssistantScreenProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side="bottom"
      showCloseButton={false}
      // 열자마자 키보드가 올라와 답을 가리지 않게 포커스를 옮기지 않는다.
      onOpenAutoFocus={(event) => event.preventDefault()}
      className="inset-0 z-[60] flex h-dvh w-full max-w-none flex-col gap-0 border-0 bg-gradient-to-b from-gradient-top to-gradient-bottom p-0 sm:max-w-none"
    >
      <SheetDescription className="sr-only">
        밴드 일정, 참석, 곡, 팀 정보를 물어보고 답을 봅니다.
      </SheetDescription>
      {/* 머리와 바닥 바는 화면 폭을 다 채우고, 안의 내용만 앱 폭(648)으로 가운데 둔다.
          바를 앱 폭에 가두면 PC에서 바가 가운데에 떠 보인다. 선 대신 반투명 바탕과 빛 번짐으로 나누는 건 다른 전체 화면 모달과 같다. */}
      <header className="bg-gradient-top/65 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 header-glow backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[648px] items-center justify-between gap-3 px-5">
          <SheetTitle className="typo-lg-sb text-grey-50">
            밴드에 대해 물어보기
          </SheetTitle>
          <div className="flex shrink-0 items-center gap-4">
            {onStartNew && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onStartNew}
                className="text-grey-100"
              >
                새 대화
              </Button>
            )}
            <AppSheetClose />
          </div>
        </div>
      </header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
        <div className="mx-auto flex w-full max-w-[648px] flex-col gap-8 px-5 pt-4 pb-6">
          {children}
        </div>
      </div>
      <div className="bg-gradient-top/65 pt-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] footer-glow backdrop-blur-sm">
        <div className="mx-auto w-full max-w-[648px] px-5">{footer}</div>
      </div>
    </SheetContent>
  </Sheet>
);
