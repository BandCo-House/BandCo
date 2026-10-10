import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/shared/ui/sheet';
import { useScheduleDetail } from '@/entities/schedule/model/queries';
import {
  createEmptyForm,
  detailToForm,
  isFormValid,
  toScheduleRequest,
  type ScheduleFormState,
} from '../model/types';
import { resolveReferenceFiles } from '../model/reference-files';
import { useCreateSchedule } from '../api/useCreateSchedule';
import { useUpdateSchedule } from '../api/useUpdateSchedule';
import {
  removeScheduleDetailCache,
  useDeleteSchedule,
} from '../api/useDeleteSchedule';
import { getApiErrorMessage } from '@/shared/api/error';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { ScheduleFormView } from './ScheduleFormView';
import { ScheduleDetailView } from './ScheduleDetailView';
import { ScheduleActionBar } from './components/ScheduleActionBar';

interface ScheduleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  bandId: string;
  initialDate?: Date;
  /** 기존 일정을 눌러 연 경우의 일정 ID. 주면 폼 대신 상세로 연다. */
  initialScheduleId?: string | null;
}

/**
 * 합주/회의 일정 플로우(풀스크린). 추가 폼 → 추가 → 상세 → 확인(닫기)/수정(폼 재진입).
 * - 추가: POST /bandspaces/:spaceId/schedules → 상세로 전환
 * - 수정: 앱바 '일정 수정' + 값 프리필 → PATCH /schedules/:id → 상세로 복귀
 * - 삭제: 상세·수정 앱바 우측 '일정 삭제' → 확인 → DELETE /schedules/:id → 닫기
 */
export const ScheduleCreateModal = ({
  isOpen,
  onClose,
  spaceId,
  bandId,
  initialDate,
  initialScheduleId = null,
}: ScheduleCreateModalProps) => {
  const [view, setView] = useState<'form' | 'detail'>('form');
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  // 참고자료 업로드는 mutation 전에 도므로 별도 진행 상태로 CTA를 잠근다.
  const [isUploading, setIsUploading] = useState(false);

  // seed가 바뀌면(열림·수정 진입) form을 그 값으로 리셋한다(effect 대신 렌더 중 파생).
  const [seed, setSeed] = useState<ScheduleFormState>(() =>
    createEmptyForm(initialDate),
  );
  const [form, setForm] = useState<ScheduleFormState>(seed);
  const [prevSeed, setPrevSeed] = useState(seed);
  if (seed !== prevSeed) {
    setPrevSeed(seed);
    setForm(seed);
  }

  // 모달을 열 때마다 초기화한다. 기존 일정을 눌러 연 경우엔 상세부터 보여준다.
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setView(initialScheduleId ? 'detail' : 'form');
      setMode('create');
      setScheduleId(initialScheduleId);
      setSeed(createEmptyForm(initialDate));
    }
  }

  const { data: detail, isError: isDetailError } =
    useScheduleDetail(scheduleId);
  const { mutate: create, isPending: isCreating } = useCreateSchedule(spaceId);
  const { mutate: update, isPending: isUpdating } =
    useUpdateSchedule(scheduleId);

  const queryClient = useQueryClient();
  const { mutate: remove, isPending: isDeleting } = useDeleteSchedule();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  // 방금 지운 일정 ID. 상세 구독(scheduleId)이 끊긴 다음 렌더에서 캐시를 지우려고 들고 있는다.
  const [deletedScheduleId, setDeletedScheduleId] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (!deletedScheduleId) return;
    removeScheduleDetailCache(queryClient, deletedScheduleId);
  }, [deletedScheduleId, queryClient]);

  // 이미 있는 일정을 보고 있을 때(상세·수정)만 지울 수 있다. 추가 폼에는 지울 대상이 없다.
  const canDelete =
    scheduleId !== null && (view === 'detail' || mode === 'edit');

  const handleDelete = () => {
    // 확인 버튼 연타로 삭제 요청이 중복 전송되지 않게 진행 중이면 무시하고 즉시 닫는다.
    if (!scheduleId || isDeleting) return;
    setIsDeleteConfirmOpen(false);
    remove(scheduleId, {
      onSuccess: () => {
        toast.success('일정을 삭제했어요.');
        setDeletedScheduleId(scheduleId);
        setScheduleId(null);
        onClose();
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, '일정 삭제에 실패했어요.'));
      },
    });
  };

  const updateForm = (patch: Partial<ScheduleFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async () => {
    if (!isFormValid(form) || isCreating || isUpdating || isUploading) return;

    // 참고자료 파일을 먼저 업로드해 objectUrl을 확보한 뒤 페이로드를 만든다.
    // 업로드가 실패하면 일정 자체를 만들지 않고 멈춘다(부분 저장 방지).
    let payload;
    try {
      setIsUploading(true);
      const referenceFiles = await resolveReferenceFiles(form.referenceFiles);
      payload = toScheduleRequest(form, referenceFiles);
    } catch {
      toast.error('첨부 파일을 올리지 못했어요. 잠시 후 다시 시도해주세요.');
      return;
    } finally {
      setIsUploading(false);
    }

    if (mode === 'create') {
      create(payload, {
        onSuccess: (result) => {
          setScheduleId(result.scheduleId);
          setView('detail');
        },
        onError: () =>
          toast.error('일정을 추가하지 못했어요. 잠시 후 다시 시도해주세요.'),
      });
    } else {
      update(payload, {
        onSuccess: () => setView('detail'),
        onError: () =>
          toast.error('일정을 수정하지 못했어요. 잠시 후 다시 시도해주세요.'),
      });
    }
  };

  const handleBack = () => {
    if (view === 'form' && mode === 'edit') {
      setView('detail');
      return;
    }
    onClose();
  };

  const handleStartEdit = () => {
    if (!detail) return;
    setSeed(detailToForm(detail));
    setMode('edit');
    setView('form');
  };

  const headerTitle =
    view === 'detail'
      ? (detail?.title ?? '일정')
      : mode === 'create'
        ? '일정 추가'
        : '일정 수정';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        showCloseButton={false}
        className="inset-0 mx-auto flex h-full w-full max-w-[648px] flex-col gap-0 border-0 bg-gradient-to-b from-gradient-top to-gradient-bottom p-0 sm:max-w-[648px]"
      >
        <SheetDescription className="sr-only">
          합주·회의 일정을 추가하거나 수정하고 상세를 확인합니다.
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
          <SheetTitle className="min-w-0 truncate typo-lg-sb text-grey-50">
            {headerTitle}
          </SheetTitle>
          {canDelete && (
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={isDeleting}
              className="ml-auto flex shrink-0 items-center gap-1.5 typo-xs-sb text-grey-300 transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>일정 삭제</span>
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">
          {view === 'form' ? (
            <ScheduleFormView
              form={form}
              onChange={updateForm}
              bandId={bandId}
            />
          ) : detail ? (
            <ScheduleDetailView detail={detail} bandId={bandId} />
          ) : isDetailError ? (
            // 일정 카드를 눌러 바로 상세로 들어오는 경로가 생겨, 조회가 실패하면
            // 로딩 문구가 영원히 남는다. 실패는 실패라고 말하고 닫을 수 있게 한다.
            <p className="py-10 text-center typo-sm-r text-grey-300">
              일정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
            </p>
          ) : (
            <p className="py-10 text-center typo-sm-r text-grey-300">
              일정을 불러오는 중이에요…
            </p>
          )}
        </div>

        {view === 'form' ? (
          <ScheduleActionBar
            secondaryLabel="취소"
            onSecondary={handleBack}
            primaryLabel={mode === 'create' ? '추가' : '수정'}
            onPrimary={handleSubmit}
            primaryDisabled={!isFormValid(form)}
            primaryLoading={isCreating || isUpdating || isUploading}
          />
        ) : (
          <ScheduleActionBar
            secondaryLabel="수정"
            onSecondary={handleStartEdit}
            // detail이 없으면 handleStartEdit이 조용히 아무 일도 안 한다.
            secondaryDisabled={!detail}
            primaryLabel="확인"
            onPrimary={onClose}
          />
        )}

        <ConfirmDialog
          open={isDeleteConfirmOpen}
          onOpenChange={setIsDeleteConfirmOpen}
          title="일정을 삭제하시겠습니까?"
          description="참여자 편성과 첨부가 함께 삭제되며 복구할 수 없습니다."
          confirmLabel="삭제"
          onConfirm={handleDelete}
        />
      </SheetContent>
    </Sheet>
  );
};
