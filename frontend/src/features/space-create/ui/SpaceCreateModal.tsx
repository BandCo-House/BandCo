import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateSpace } from '@/entities/space/api/useCreateSpace';
import {
  AppDialogBody,
  AppDialogClose,
  AppDialogContent,
  Dialog,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Switch } from '@/shared/ui/switch';
import { WheelDatePicker } from '@/shared/ui/wheel-date-picker';
import {
  toDateString,
  toWheelDate,
  type WheelDate,
} from '@/shared/ui/wheel-date';

interface SpaceCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
}

// 종료 없음(상시)일 때 백엔드가 endDate를 필수로 받으므로 먼 미래(9999) sentinel을 보낸다.
// 뱃지는 spaceType(PRACTICE)로 상시 처리하므로 이 날짜 자체는 표시에 쓰이지 않는다.
const ONGOING_END_DATE = '9999-12-31';

const compareDate = (a: WheelDate, b: WheelDate) =>
  a.year - b.year || a.month - b.month || a.day - b.day;

/**
 * 합주 공간 만들기 모달. 이름/설명 + 합주 기간(종료 날짜 토글로 상시/기간제).
 * 종료 있음 → PERFORMANCE(D-day), 종료 없음(상시) → PRACTICE. status는 ACTIVE 고정.
 */
export const SpaceCreateModal = ({
  open,
  onOpenChange,
  bandId,
}: SpaceCreateModalProps) => {
  const { mutate, isPending } = useCreateSpace(bandId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hasEnd, setHasEnd] = useState(true);
  const [startDate, setStartDate] = useState<WheelDate>(() =>
    toWheelDate(new Date()),
  );
  const [endDate, setEndDate] = useState<WheelDate>(() =>
    toWheelDate(new Date()),
  );

  // 열릴 때 폼을 초기화한다(effect 대신 렌더 중 파생).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const today = toWheelDate(new Date());
      setName('');
      setDescription('');
      setHasEnd(true);
      setStartDate(today);
      setEndDate(today);
    }
  }

  const endBeforeStart = hasEnd && compareDate(endDate, startDate) < 0;
  const canSubmit = name.trim().length > 0 && !endBeforeStart && !isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const trimmedDescription = description.trim();
    mutate(
      {
        name: name.trim(),
        description: trimmedDescription || undefined,
        spaceType: hasEnd ? 'PERFORMANCE' : 'PRACTICE',
        status: 'ACTIVE',
        startDate: toDateString(startDate),
        endDate: hasEnd ? toDateString(endDate) : ONGOING_END_DATE,
      },
      {
        onSuccess: () => {
          toast.success('합주 공간을 만들었어요.');
          onOpenChange(false);
        },
        onError: () => {
          toast.error(
            '합주 공간을 만들지 못했어요. 잠시 후 다시 시도해주세요.',
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="flex max-h-[85vh] flex-col gap-10 p-5 text-grey-50">
        <AppDialogClose
          className="top-5 right-5"
          aria-label="합주 공간 만들기 닫기"
        />
        <DialogTitle className="pr-12">합주 공간 만들기</DialogTitle>

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
              onChange={(event) => setName(event.target.value)}
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
              onChange={(event) => setDescription(event.target.value)}
              placeholder="부가 설명을 추가할 수 있어요"
              maxLength={50}
            />
          </Field>

          <div className="relative flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <FieldLabel required size="lg">
                합주 기간
              </FieldLabel>
              <span className="flex items-center gap-2.5">
                <span className="typo-xs-sb text-grey-200">종료 날짜</span>
                <Switch
                  aria-label="종료 날짜 사용"
                  checked={hasEnd}
                  onCheckedChange={setHasEnd}
                />
              </span>
            </div>

            {/* 토글 여부와 무관하게 높이를 232로 고정하고, 내용을 세로 중앙에 둬 위아래 여백을 준다. */}
            <div className="flex h-[232px] flex-col justify-center gap-6 rounded-md field-border border-surface-1 bg-grey-600/20 px-2.5 backdrop-blur-md">
              <WheelDatePicker
                label="시작"
                value={startDate}
                onChange={setStartDate}
              />
              {hasEnd ? (
                <WheelDatePicker
                  label="종료"
                  value={endDate}
                  onChange={setEndDate}
                />
              ) : (
                <p className="text-center typo-xs-sb text-grey-50">
                  정해진 기간이 없는 합주 공간
                </p>
              )}
            </div>
            {/* 주변에 다른 요소가 없어 absolute로 띄워 레이아웃을 밀지 않는다. */}
            {endBeforeStart && (
              <p className="absolute top-full mt-1 typo-sm-r text-destructive">
                종료 날짜는 시작 날짜 이후여야 해요.
              </p>
            )}
          </div>
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
            만들기
          </Button>
        </div>
      </AppDialogContent>
    </Dialog>
  );
};
