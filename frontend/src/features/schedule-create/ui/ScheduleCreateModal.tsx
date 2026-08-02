import { useState } from 'react';
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
import { useCreateSchedule } from '../api/useCreateSchedule';
import { useUpdateSchedule } from '../api/useUpdateSchedule';
import { ScheduleFormView } from './ScheduleFormView';
import { ScheduleDetailView } from './ScheduleDetailView';
import { ScheduleActionBar } from './components/ScheduleActionBar';

interface ScheduleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  bandId: string;
  initialDate?: Date;
}

/**
 * 합주/회의 일정 플로우(풀스크린). 추가 폼 → 추가 → 상세 → 확인(닫기)/수정(폼 재진입).
 * - 추가: POST /bandspaces/:spaceId/schedules → 상세로 전환
 * - 수정: 앱바 '일정 수정' + 값 프리필 → PATCH /schedules/:id → 상세로 복귀
 */
export const ScheduleCreateModal = ({
  isOpen,
  onClose,
  spaceId,
  bandId,
  initialDate,
}: ScheduleCreateModalProps) => {
  const [view, setView] = useState<'form' | 'detail'>('form');
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [scheduleId, setScheduleId] = useState<string | null>(null);

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

  // 모달을 열 때마다 생성 모드로 초기화한다.
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setView('form');
      setMode('create');
      setScheduleId(null);
      setSeed(createEmptyForm(initialDate));
    }
  }

  const { data: detail } = useScheduleDetail(scheduleId);
  const { mutate: create, isPending: isCreating } = useCreateSchedule(spaceId);
  const { mutate: update, isPending: isUpdating } =
    useUpdateSchedule(scheduleId);

  const updateForm = (patch: Partial<ScheduleFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    if (!isFormValid(form) || isCreating || isUpdating) return;
    const payload = toScheduleRequest(form);

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
          <SheetTitle className="typo-lg-sb text-grey-50">
            {headerTitle}
          </SheetTitle>
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
            primaryLoading={isCreating || isUpdating}
          />
        ) : (
          <ScheduleActionBar
            secondaryLabel="수정"
            onSecondary={handleStartEdit}
            primaryLabel="확인"
            onPrimary={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};
