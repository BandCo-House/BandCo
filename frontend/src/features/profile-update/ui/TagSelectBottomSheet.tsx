import { useState } from 'react';
import { chipSurfaceClass } from '@/shared/ui/chip-surface';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  AppSheetClose,
} from '@/shared/ui/sheet';
import { Loader2 } from 'lucide-react';
import PinIcon from '@/assets/icons/pin.svg?react';
import { cn } from '@/shared/lib/utils';

export interface TagItem {
  id: string;
  name: string;
}

export interface TagSelectBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: TagItem[];
  selectedIds: string[];
  onSave?: (selectedIds: string[]) => void | Promise<void>;
  isLoading?: boolean;
  isError?: boolean;
  /**
   * 선택 순서가 무슨 의미인지 알려주는 안내 문구. 시트 제목 아래에 보인다.
   *
   * 칩의 1·2·3 번호만으로는 순위가 있는 것처럼 읽히는데, 실제로 저장되는 건
   * 플레이 파트의 첫 번째(isPrimary)뿐이다. 번호 UI를 바꾸는 건 디자인 결정이라
   * 일단 문구로 무엇이 저장되는지 말해준다.
   */
  description?: string;
}

export function TagSelectBottomSheet({
  open,
  onOpenChange,
  title,
  items,
  selectedIds,
  onSave,
  isLoading = false,
  isError = false,
  description,
}: TagSelectBottomSheetProps) {
  // 시트 안에서 고른 임시 선택. null이면 아직 손대지 않은 상태라 selectedIds를 그대로 쓴다.
  const [tempSelectedIds, setTempSelectedIds] = useState<string[] | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  // Controlled open prop 변경 감지: 열리는 순간 임시 선택을 비워 최신 selectedIds부터 시작한다
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTempSelectedIds(null);
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      const tempIds = tempSelectedIds ?? selectedIds;
      const isDifferent =
        tempIds.length !== selectedIds.length ||
        tempIds.some((id, idx) => id !== selectedIds[idx]);

      if (isDifferent && onSave) {
        void onSave(tempIds);
      }
    }
    setTempSelectedIds(null);
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        // 높이는 400px 고정(디자인). 목록이 길어져도 시트가 커지지 않고 칩 영역만 스크롤한다.
        className="fixed right-[var(--removed-body-scroll-bar-size,0px)] bottom-0 left-0 mx-auto flex h-[400px] max-h-[400px] w-full max-w-[648px] flex-col gap-[18px] rounded-t-3xl border-t border-grey-500 bg-gradient-bottom p-5 text-grey-50 shadow-2xl backdrop-blur-2xl"
      >
        <SheetHeader className="flex flex-row items-start justify-between gap-4 p-0">
          <div className="flex min-w-0 flex-col gap-2">
            {/* 디자인은 16이었지만 설명이 레포 규칙에 따라 14로 올라가 위계가 2px밖에
                안 남았다. 섹션 제목 크기(18)로 올려 제목이 설명을 누르게 한다. */}
            <SheetTitle className="typo-lg-b text-grey-50">{title}</SheetTitle>
            <SheetDescription
              className={cn(
                description ? 'typo-sm-sb text-grey-200' : 'sr-only',
              )}
            >
              {description ?? `${title} 선택 바텀시트`}
            </SheetDescription>
          </div>
          <AppSheetClose
            aria-label="닫기"
            className="shrink-0 text-grey-200 hover:text-white"
          />
        </SheetHeader>

        {open && (
          <TagSelectContent
            key={selectedIds.join(',')}
            items={items}
            initialSelectedIds={selectedIds}
            isLoading={isLoading}
            isError={isError}
            onSelectionChange={setTempSelectedIds}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

interface TagSelectContentProps {
  items: TagItem[];
  initialSelectedIds: string[];
  isLoading: boolean;
  isError: boolean;
  onSelectionChange: (ids: string[]) => void;
}

function TagSelectContent({
  items,
  initialSelectedIds,
  isLoading,
  isError,
  onSelectionChange,
}: TagSelectContentProps) {
  const [tempSelectedIds, setTempSelectedIds] =
    useState<string[]>(initialSelectedIds);

  const handleToggle = (id: string) => {
    setTempSelectedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      onSelectionChange(next);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 py-12 typo-sm-sb text-grey-300">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span>목록을 불러오는 중...</span>
      </div>
    );
  }

  // 실패·빈 목록에서 조용히 빈 시트만 뜨면 버튼이 고장난 것처럼 보인다 — 상태를 말해준다.
  if (isError || items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12 text-center typo-sm-r text-grey-300">
        {isError
          ? '목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
          : '선택할 수 있는 항목이 아직 없습니다.'}
      </div>
    );
  }

  return (
    // 시트 높이가 고정이라 스크롤은 여기서만 생긴다.
    <div className="min-h-0 scrollbar-glass flex-1 overflow-y-auto">
      <div className="flex flex-wrap gap-x-1.5 gap-y-[5px]">
        {items.map((item) => {
          const selectedIndex = tempSelectedIds.indexOf(item.id);
          const isSelected = selectedIndex !== -1;
          const isPrimary = selectedIndex === 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleToggle(item.id)}
              aria-pressed={isSelected}
              className={cn(
                'flex items-center justify-center gap-2 rounded-md px-4 py-2 typo-xs-sb transition-colors select-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none',
                isSelected
                  ? chipSurfaceClass.selected
                  : chipSurfaceClass.unselected,
              )}
            >
              {/* 첫 선택은 핀(대표), 그 뒤는 번호. 번호가 2부터 시작하는 건 1번 자리를
                  핀이 대신하기 때문이다 — 저장되는 isPrimary도 이 첫 칩이다.
                  핀·번호는 장식이라 aria-hidden으로 두고, 같은 정보를 sr-only 텍스트로
                  따로 준다. 그게 없으면 스크린리더는 '선택됨'까지만 알고 어느 것이
                  대표인지·몇 번째인지 알 수 없다. */}
              {isPrimary && (
                <PinIcon
                  aria-hidden="true"
                  data-slot="svg-icon"
                  className="size-4 shrink-0"
                />
              )}
              {isSelected && !isPrimary && (
                <span
                  aria-hidden="true"
                  className="flex size-4 shrink-0 items-center justify-center rounded-md bg-gradient-top typo-xs-sb text-primary"
                >
                  {selectedIndex + 1}
                </span>
              )}
              <span>{item.name}</span>
              {isSelected && (
                <span className="sr-only">
                  {isPrimary ? '대표' : `${selectedIndex + 1}번째`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
