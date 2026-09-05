import { useState, useEffect } from 'react';
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
}

export function TagSelectBottomSheet({
  open,
  onOpenChange,
  title,
  items,
  selectedIds,
  onSave,
  isLoading = false,
}: TagSelectBottomSheetProps) {
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedIds);

  // 시트가 열릴 때마다 현재 선택된 IDs로 로컬 상태 동기화
  useEffect(() => {
    if (open) {
      setTempSelectedIds(selectedIds);
    }
  }, [open, selectedIds]);

  const handleToggle = (id: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // 닫힐 때 변경사항 확인
      const isDifferent =
        tempSelectedIds.length !== selectedIds.length ||
        tempSelectedIds.some((id, idx) => id !== selectedIds[idx]);

      if (isDifferent && onSave) {
        void onSave(tempSelectedIds);
      }
    }
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[85vh] rounded-t-3xl border-t border-grey-50/15 bg-[#12131E] p-6 text-grey-50 shadow-2xl backdrop-blur-2xl"
      >
        <SheetHeader className="flex flex-row items-center justify-between p-0">
          <SheetTitle className="typo-lg-b text-grey-50">{title}</SheetTitle>
          <SheetDescription className="sr-only">{title} 선택 바텀시트</SheetDescription>
          <AppSheetClose aria-label="닫기" />
        </SheetHeader>

        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 typo-sm-m text-grey-300">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span>목록을 불러오는 중...</span>
            </div>
          ) : (
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
                      'flex items-center rounded-full px-4 py-2 transition-all select-none typo-base-sb focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none',
                      isSelected
                        ? 'bg-[#E7FF86] text-[#12131E] shadow-sm'
                        : 'border border-grey-50/20 bg-surface-2/40 text-grey-100 hover:border-grey-50/40 hover:bg-white/10',
                    )}
                  >
                    {isSelected && (
                      <span className="mr-1.5 flex size-5 items-center justify-center rounded-full bg-[#12131E] typo-xs-b text-white">
                        {selectedIndex + 1}
                      </span>
                    )}
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
