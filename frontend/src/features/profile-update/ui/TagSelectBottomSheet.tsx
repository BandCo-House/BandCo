import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  AppSheetClose,
} from '@/shared/ui/sheet';
import { Loader2 } from 'lucide-react';
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
        className="fixed right-[var(--removed-body-scroll-bar-size,0px)] bottom-0 left-0 mx-auto flex h-[60vh] max-h-[60vh] w-full max-w-[648px] flex-col gap-0 rounded-t-3xl border-t border-grey-50/15 bg-[#12131E] p-6 text-grey-50 shadow-2xl backdrop-blur-2xl"
      >
        <SheetHeader className="flex flex-row items-center justify-between p-0">
          <SheetTitle className="typo-lg-b text-grey-50">{title}</SheetTitle>
          <SheetDescription className="sr-only">
            {title} 선택 바텀시트
          </SheetDescription>
          <AppSheetClose
            aria-label="닫기"
            className="text-grey-200 hover:text-white"
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
    <div className="mt-4 flex-1 overflow-y-auto pr-1 pb-6">
      <div className="flex flex-wrap gap-2.5">
        {items.map((item) => {
          const selectedIndex = tempSelectedIds.indexOf(item.id);
          const isSelected = selectedIndex !== -1;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleToggle(item.id)}
              aria-pressed={isSelected}
              className={cn(
                'flex items-center rounded-full px-4 py-2 typo-base-sb transition-all select-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none',
                isSelected
                  ? 'bg-[#E7FF86] text-[#12131E] shadow-sm'
                  : 'border border-grey-50/20 bg-surface-2/40 text-grey-100 hover:border-grey-50/40 hover:bg-white/10',
              )}
            >
              {isSelected && (
                <span className="mr-1.5 flex size-5 items-center justify-center rounded-full bg-[#12131E] typo-xs-sb text-white">
                  {selectedIndex + 1}
                </span>
              )}
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
