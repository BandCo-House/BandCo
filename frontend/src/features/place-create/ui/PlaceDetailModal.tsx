import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { useDeletePlace } from '@/entities/place/api/useDeletePlace';
import type { Place } from '@/entities/place/model/types';
import { PlaceDetailView } from '@/entities/place/ui/PlaceDetailView';
import { getApiErrorMessage } from '@/shared/api/error';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/shared/ui/sheet';
import { PlaceFormView } from './PlaceFormView';

interface PlaceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
  /**
   * 보여줄 장소. 닫을 때 같이 비우지 않는다 — 비우면 시트가 내려가는 동안
   * 내용이 먼저 사라져 빈 화면이 닫히는 것처럼 보인다.
   */
  place: Place | null;
  /** 삭제 액션 노출 여부. 백엔드 권한(리더·부리더)과 같은 조건을 호출부가 판단한다. */
  canDelete: boolean;
}

/**
 * 연습 장소 플로우(풀스크린). 상세 → 수정(폼) → 상세로, 일정 상세와 같이 한 시트 안에서
 * 화면만 바꾼다. 수정을 별도 시트로 띄우면 같은 장소 위에 시트가 한 겹 더 올라온다.
 */
export const PlaceDetailModal = ({
  open,
  onOpenChange,
  bandId,
  place,
  canDelete,
}: PlaceDetailModalProps) => {
  const [view, setView] = useState<'detail' | 'edit'>('detail');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { mutate: remove, isPending: isDeleting } = useDeletePlace();

  // 열 때마다 상세부터 보여준다(effect 대신 렌더 중 파생).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setView('detail');
  }

  const close = () => onOpenChange(false);

  const handleBack = () => {
    if (view === 'edit') {
      setView('detail');
      return;
    }
    close();
  };

  const handleDelete = () => {
    // 확인 버튼 연타로 삭제 요청이 중복 전송되지 않게 진행 중이면 무시하고 즉시 닫는다.
    if (!place || isDeleting) return;
    setIsConfirmOpen(false);
    remove(place.placeId, {
      onSuccess: () => {
        toast.success('연습 장소를 삭제했어요.');
        close();
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, '연습 장소 삭제에 실패했어요.'));
      },
    });
  };

  return (
    <Sheet open={open && place !== null} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className="inset-0 mx-auto flex h-full w-full max-w-[648px] flex-col gap-0 border-0 bg-gradient-to-b from-gradient-top to-gradient-bottom p-0 sm:max-w-[648px]"
      >
        <SheetDescription className="sr-only">
          연습 장소의 이름과 위치를 확인하고 수정합니다.
        </SheetDescription>

        <header className="flex items-center gap-4 bg-gradient-top/65 py-3 pr-5 pl-2.5 header-glow backdrop-blur-sm">
          <button
            type="button"
            aria-label="뒤로 가기"
            onClick={handleBack}
            className="inline-flex size-10 items-center justify-center rounded-full text-grey-50 focus-visible:outline-2 focus-visible:outline-key"
          >
            <ArrowRightIcon aria-hidden="true" className="size-6 rotate-180" />
          </button>
          {/* 수정 화면은 폼이 본문에 큰 제목(SheetTitle)을 직접 그린다. */}
          {view === 'detail' && (
            <SheetTitle className="typo-lg-sb text-grey-50">
              연습 장소
            </SheetTitle>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isDeleting}
              className="ml-auto flex items-center gap-1.5 typo-xs-sb text-grey-300 transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>장소 삭제</span>
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </header>

        {place && view === 'edit' && (
          <PlaceFormView
            bandId={bandId}
            place={place}
            onCancel={() => setView('detail')}
            onSaved={() => setView('detail')}
          />
        )}

        {place && view === 'detail' && (
          <>
            <div className="flex-1 overflow-y-auto p-5">
              <PlaceDetailView place={place} />
            </div>
            <div className="flex items-center justify-end gap-3 bg-gradient-top/65 px-5 py-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] footer-glow backdrop-blur-sm">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="border-grey-200 text-grey-100"
                onClick={() => setView('edit')}
              >
                수정
              </Button>
              <Button type="button" variant="shining" size="lg" onClick={close}>
                확인
              </Button>
            </div>
          </>
        )}

        <ConfirmDialog
          open={isConfirmOpen}
          onOpenChange={setIsConfirmOpen}
          title="연습 장소를 삭제하시겠습니까?"
          description="라이브러리와 일정 추가의 장소 목록에서 사라져요. 이 장소로 잡아 둔 일정은 그대로 남아요."
          confirmLabel="삭제"
          onConfirm={handleDelete}
        />
      </SheetContent>
    </Sheet>
  );
};
