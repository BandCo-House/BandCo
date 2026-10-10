import { useState } from 'react';
import { toast } from 'sonner';
import type { SpaceDetailView } from '@/entities/space/api/space-api';
import { useCreateSpace } from '@/entities/space/api/useCreateSpace';
import { useUpdateSpace } from '@/entities/space/api/useUpdateSpace';
import { ParticipantSection } from '@/features/schedule-create/ui/components/ParticipantSection';
import {
  AppDialogBody,
  AppDialogClose,
  AppDialogHeader,
  AppDialogContent,
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Switch } from '@/shared/ui/switch';
import { WheelDatePicker } from '@/shared/ui/wheel-date-picker';
import { WheelFieldCard } from '@/shared/ui/wheel-field-card';
import {
  toDateString,
  toWheelDate,
  type WheelDate,
} from '@/shared/ui/wheel-date';

interface SpaceCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
  /**
   * 주면 수정 모드다. 이 공간의 값으로 폼을 채우고, 저장하면 생성 대신 수정한다.
   * 같은 모달을 쓰므로 생성 폼이 바뀌면 수정 폼도 함께 바뀐다.
   */
  editTarget?: SpaceDetailView;
}

interface SpaceFormState {
  name: string;
  description: string;
  hasEnd: boolean;
  startDate: WheelDate;
  endDate: WheelDate;
  bandMemberIds: string[];
}

// 종료 없음(상시)일 때 백엔드가 endDate를 필수로 받으므로 먼 미래(9999) sentinel을 보낸다.
// 뱃지는 spaceType(PRACTICE)로 상시 처리하므로 이 날짜 자체는 표시에 쓰이지 않는다.
const ONGOING_END_DATE = '9999-12-31';

// 문구를 흐름에 두고 id로 휠 카드와 잇는다. absolute로 띄우면 레이아웃은 안 밀지만
// 스크롤 컨테이너의 overflow에는 그대로 잡혀, 정작 문구는 보이지 않은 채
// 모달에만 스크롤이 생긴다(측정: scrollHeight 508 → 532, clientHeight 508).
const SPACE_PERIOD_ERROR_ID = 'space-period-error';

const compareDate = (a: WheelDate, b: WheelDate) =>
  a.year - b.year || a.month - b.month || a.day - b.day;

/** 'YYYY-MM-DD…' → WheelDate. Date로 파싱하면 UTC 자정이 시간대에 따라 전날로 밀린다. */
const parseDateOnly = (value: string): WheelDate => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return { year, month, day };
};

// 모드별 문구. 폼 구조는 같고 말만 다르다.
const MODE_COPY = {
  create: {
    title: '합주 공간 만들기',
    description: '이름과 기간을 입력해 새 합주 공간을 만듭니다.',
    submit: '만들기',
    success: '합주 공간을 만들었어요.',
    error: '합주 공간을 만들지 못했어요. 잠시 후 다시 시도해주세요.',
  },
  edit: {
    title: '합주 공간 수정',
    description: '합주 공간의 이름과 기간, 참여자를 수정합니다.',
    submit: '수정',
    success: '합주 공간을 수정했어요.',
    error: '합주 공간을 수정하지 못했어요. 잠시 후 다시 시도해주세요.',
  },
} as const;

const createInitialForm = (editTarget?: SpaceDetailView): SpaceFormState => {
  const today = toWheelDate(new Date());
  if (!editTarget) {
    return {
      name: '',
      description: '',
      hasEnd: true,
      startDate: today,
      endDate: today,
      bandMemberIds: [],
    };
  }

  const { space, memberBandMemberIds } = editTarget;
  const startDate = parseDateOnly(space.startDate);
  // 상시 공간의 endDate는 sentinel(9999)이라 휠에 올리지 않는다. 종료 날짜를 켜면
  // 시작 날짜에서 고르기 시작한다.
  const hasEnd = space.spaceType === 'PERFORMANCE' && space.endDate !== null;
  return {
    name: space.name,
    description: space.description,
    hasEnd,
    startDate,
    endDate: hasEnd && space.endDate ? parseDateOnly(space.endDate) : startDate,
    bandMemberIds: memberBandMemberIds,
  };
};

/**
 * 합주 공간 만들기·수정 모달. 이름/설명 + 합주 기간(종료 날짜 토글로 상시/기간제) + 참여자.
 * 종료 있음 → PERFORMANCE(D-day), 종료 없음(상시) → PRACTICE. 생성 시 status는 ACTIVE 고정이고
 * 수정은 status를 보내지 않아 기존 값을 유지한다.
 * 참여자는 일정과 같은 방식(직접 추가·팀 추가)으로 고른다.
 */
export const SpaceCreateModal = ({
  open,
  onOpenChange,
  bandId,
  editTarget,
}: SpaceCreateModalProps) => {
  const mode = editTarget ? 'edit' : 'create';
  const copy = MODE_COPY[mode];
  const createMutation = useCreateSpace(bandId);
  const updateMutation = useUpdateSpace(editTarget?.space.spaceId ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState<SpaceFormState>(() =>
    createInitialForm(editTarget),
  );
  const { name, description, hasEnd, startDate, endDate, bandMemberIds } = form;
  const updateForm = (patch: Partial<SpaceFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  // 열릴 때 폼을 초기화한다(effect 대신 렌더 중 파생).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setForm(createInitialForm(editTarget));
  }

  const endBeforeStart = hasEnd && compareDate(endDate, startDate) < 0;
  const canSubmit =
    name.trim().length > 0 &&
    bandMemberIds.length > 0 &&
    !endBeforeStart &&
    !isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const trimmedDescription = description.trim();
    const payload = {
      name: name.trim(),
      spaceType: hasEnd ? 'PERFORMANCE' : 'PRACTICE',
      startDate: toDateString(startDate),
      endDate: hasEnd ? toDateString(endDate) : ONGOING_END_DATE,
      bandMemberIds,
    } as const;
    const callbacks = {
      onSuccess: () => {
        toast.success(copy.success);
        onOpenChange(false);
      },
      onError: () => {
        toast.error(copy.error);
      },
    };

    if (mode === 'edit') {
      // 수정은 빈 문자열도 그대로 보낸다 — 생략하면 "설명을 지움"을 표현할 수 없다.
      updateMutation.mutate(
        { ...payload, description: trimmedDescription },
        callbacks,
      );
    } else {
      createMutation.mutate(
        {
          ...payload,
          description: trimmedDescription || undefined,
          status: 'ACTIVE',
        },
        callbacks,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent size="full" className="gap-10 text-grey-50">
        <AppDialogHeader className="mb-0">
          <DialogTitle>{copy.title}</DialogTitle>
          <AppDialogClose aria-label={`${copy.title} 닫기`} />
        </AppDialogHeader>
        <DialogDescription className="sr-only">
          {copy.description}
        </DialogDescription>

        <AppDialogBody className="gap-9 overflow-y-auto">
          <Field
            label="합주 공간 이름"
            required
            labelSize="lg"
            htmlFor="space-name"
          >
            <Input
              id="space-name"
              variant="underline"
              value={name}
              onChange={(event) => updateForm({ name: event.target.value })}
              placeholder="합주 공간 이름을 입력하세요"
              maxLength={30}
              aria-required
            />
          </Field>

          <Field label="설명" labelSize="lg" htmlFor="space-description">
            <Input
              id="space-description"
              variant="underline"
              value={description}
              onChange={(event) =>
                updateForm({ description: event.target.value })
              }
              placeholder="부가 설명을 추가할 수 있어요"
              maxLength={50}
            />
          </Field>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <FieldLabel required size="lg">
                합주 기간
              </FieldLabel>
              <span className="flex items-center gap-2.5">
                <span className="typo-xs-sb text-grey-200">종료 날짜</span>
                <Switch
                  aria-label="종료 날짜 사용"
                  checked={hasEnd}
                  onCheckedChange={(checked) => updateForm({ hasEnd: checked })}
                />
              </span>
            </div>

            {/* 토글 여부와 무관하게 높이가 232에서 출렁이지 않게 하고, 내용을 세로 중앙에 둔다.
                고정(h)이 아니라 최소(min-h)인 이유: 좁은 화면에서 라벨이 휠 위로 줄바꿈되면
                내용이 232를 넘는다. */}
            <WheelFieldCard
              className="min-h-[232px] justify-center px-2.5 py-4"
              role="group"
              aria-label="합주 기간"
              aria-invalid={endBeforeStart || undefined}
              aria-describedby={
                endBeforeStart ? SPACE_PERIOD_ERROR_ID : undefined
              }
            >
              <WheelDatePicker
                className="relative z-10"
                label="시작"
                value={startDate}
                onChange={(next) => updateForm({ startDate: next })}
              />
              {hasEnd ? (
                <WheelDatePicker
                  className="relative z-10"
                  label="종료"
                  value={endDate}
                  onChange={(next) => updateForm({ endDate: next })}
                />
              ) : (
                <p className="text-center typo-xs-sb text-grey-50">
                  정해진 기간이 없는 합주 공간
                </p>
              )}
            </WheelFieldCard>
            {endBeforeStart && (
              <p
                id={SPACE_PERIOD_ERROR_ID}
                className="typo-sm-r text-destructive"
              >
                종료 날짜는 시작 날짜 이후여야 해요.
              </p>
            )}
          </div>

          <ParticipantSection
            bandId={bandId}
            value={bandMemberIds}
            onChange={(ids) => updateForm({ bandMemberIds: ids })}
          />
        </AppDialogBody>

        {/* 버튼은 스크롤 본문 밖(푸터)에 둔다: 본문 overflow가 shining 글로우를 자르지 않도록. */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="shining"
            size="lg"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {copy.submit}
          </Button>
        </div>
      </AppDialogContent>
    </Dialog>
  );
};
