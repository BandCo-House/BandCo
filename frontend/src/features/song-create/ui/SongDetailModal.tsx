import { useState, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { useDeleteSong } from '@/entities/song/api/useDeleteSong';
import type { SongListItem } from '@/entities/song/model/types';
import { SongDetailView } from '@/entities/song/ui/SongDetailView';
import { getApiErrorMessage } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/shared/ui/sheet';
import { SongFormView } from './SongFormView';

interface SongDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * 보여줄 곡. 닫을 때 같이 비우지 않는다 — 비우면 시트가 내려가는 동안
   * 내용이 먼저 사라져 빈 화면이 닫히는 것처럼 보인다.
   */
  song: SongListItem | null;
  /** 삭제 액션 노출 여부. 백엔드 권한(밴드 멤버)과 같은 조건을 호출부가 판단한다. */
  canDelete?: boolean;
  /**
   * 수정 모드 폼 뷰 컴포넌트
   */
  editFormView?: (props: {
    song: SongListItem;
    onCancel: () => void;
    onSaved: () => void;
  }) => ReactNode;
}

/**
 * 합주곡 상세 플로우(풀스크린). 상세 → 수정(폼) → 상세로,
 * 한 시트 안에서 화면만 전환한다.
 */
export const SongDetailModal = ({
  open,
  onOpenChange,
  song,
  canDelete = true,
  editFormView,
}: SongDetailModalProps) => {
  const [view, setView] = useState<'detail' | 'edit'>('detail');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { mutate: removeSong, isPending: isDeleting } = useDeleteSong();

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
    if (!song || isDeleting) return;
    setIsConfirmOpen(false);
    removeSong(song.id, {
      onSuccess: () => {
        toast.success('합주곡을 삭제했어요.');
        close();
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, '합주곡 삭제에 실패했어요.'));
      },
    });
  };

  return (
    <Sheet open={open && song !== null} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className="inset-0 mx-auto flex h-full w-full max-w-[648px] flex-col gap-0 border-0 bg-gradient-to-b from-gradient-top to-gradient-bottom p-0 sm:max-w-[648px]"
      >
        <SheetDescription className="sr-only">
          합주곡의 기본 정보, 조성, BPM, 참고 자료 및 외부 링크를 확인합니다.
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
          {view === 'detail' && (
            <SheetTitle className="truncate typo-lg-sb text-grey-50">
              {song?.title ?? '합주곡 상세'}
            </SheetTitle>
          )}
          {view === 'detail' && canDelete && (
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isDeleting}
              className="ml-auto flex items-center gap-1.5 typo-xs-sb text-grey-300 transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>곡 삭제</span>
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </header>

        {song && view === 'edit' && (
          editFormView ? (
            editFormView({
              song,
              onCancel: () => setView('detail'),
              onSaved: () => setView('detail'),
            })
          ) : (
            <SongFormView
              song={song}
              onCancel={() => setView('detail')}
              onSaved={() => setView('detail')}
            />
          )
        )}

        {song && view === 'detail' && (
          <>
            <div className="flex-1 overflow-y-auto p-5 pb-8">
              <SongDetailView song={song} />
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
              <Button
                type="button"
                variant="shining"
                size="lg"
                onClick={close}
              >
                확인
              </Button>
            </div>
          </>
        )}

        <ConfirmDialog
          open={isConfirmOpen}
          onOpenChange={setIsConfirmOpen}
          title="합주곡을 삭제하시겠습니까?"
          description="라이브러리와 합주곡 목록에서 삭제돼요."
          confirmLabel="삭제"
          onConfirm={handleDelete}
        />
      </SheetContent>
    </Sheet>
  );
};
