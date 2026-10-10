import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { Sheet, SheetContent, SheetDescription } from '@/shared/ui/sheet';
import { PlaceFormView } from './PlaceFormView';

interface PlaceCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
  /** 생성 성공 시 새 장소 ID. 폼에서 방금 만든 장소를 바로 선택하는 데 쓴다. */
  onCreated?: (placeId: string) => void;
}

/** 연습 장소 추가(풀스크린). 폼 자체는 PlaceFormView가 맡는다. */
export const PlaceCreateModal = ({
  open,
  onOpenChange,
  bandId,
  onCreated,
}: PlaceCreateModalProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      showCloseButton={false}
      className="inset-0 mx-auto flex h-full w-full max-w-[648px] flex-col gap-0 border-0 bg-gradient-to-b from-gradient-top to-gradient-bottom p-0 sm:max-w-[648px]"
    >
      <SheetDescription className="sr-only">
        연습 장소의 이름·위치·커버를 입력해 추가합니다.
      </SheetDescription>

      <header className="flex items-center bg-gradient-top/65 py-3 pr-5 pl-2.5 header-glow backdrop-blur-sm">
        <button
          type="button"
          aria-label="뒤로 가기"
          onClick={() => onOpenChange(false)}
          className="inline-flex size-10 items-center justify-center rounded-full text-grey-50 focus-visible:outline-2 focus-visible:outline-key"
        >
          <ArrowRightIcon aria-hidden="true" className="size-6 rotate-180" />
        </button>
      </header>

      <PlaceFormView
        bandId={bandId}
        onCancel={() => onOpenChange(false)}
        onSaved={(placeId) => {
          onCreated?.(placeId);
          onOpenChange(false);
        }}
      />
    </SheetContent>
  </Sheet>
);
