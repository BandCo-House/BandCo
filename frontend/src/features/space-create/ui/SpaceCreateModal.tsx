import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useCreateSpace } from '@/entities/space/api/useCreateSpace';
import {
  AppDialogBody,
  AppDialogClose,
  AppDialogContent,
  AppDialogHeader,
  Dialog,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
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

// 종료 없음(상시)일 때 백엔드가 endDate를 필수로 받으므로 임시 sentinel을 보낸다.
// (백엔드가 endDate optional로 바뀌면 제거하고 생략한다.)
const ONGOING_END_DATE = '2999-12-31';

const FieldLabel = ({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) => (
  <span className="flex items-center gap-1 typo-lg-sb text-grey-50">
    {children}
    {required && (
      <span aria-hidden="true" className="size-1 rounded-full bg-destructive" />
    )}
  </span>
);

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
        <AppDialogHeader className="mb-0">
          <DialogTitle className="typo-lg-sb text-grey-100">
            합주 공간 만들기
          </DialogTitle>
        </AppDialogHeader>
        <AppDialogClose aria-label="합주 공간 만들기 닫기" />

        <AppDialogBody className="gap-9 overflow-y-auto">
          <label className="flex flex-col gap-2">
            <FieldLabel required>합주 공간 이름</FieldLabel>
            <Input
              variant="underline"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="합주 공간 이름을 입력하세요"
              maxLength={30}
              aria-required
            />
          </label>

          <label className="flex flex-col gap-2">
            <FieldLabel>설명</FieldLabel>
            <Input
              variant="underline"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="부가 설명을 추가할 수 있어요"
              maxLength={50}
            />
          </label>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <FieldLabel required>합주 기간</FieldLabel>
              <span className="flex items-center gap-2.5">
                <span className="typo-xs-sb text-grey-200">종료 날짜</span>
                <Switch
                  aria-label="종료 날짜 사용"
                  checked={hasEnd}
                  onCheckedChange={setHasEnd}
                />
              </span>
            </div>

            <div className="flex flex-col gap-8 rounded-md border-[0.5px] border-surface-1/40 bg-white/24 px-2.5 py-6 backdrop-blur-md">
              <WheelDatePicker value={startDate} onChange={setStartDate} />
              {hasEnd ? (
                <WheelDatePicker value={endDate} onChange={setEndDate} />
              ) : (
                <p className="text-center typo-sm-r text-grey-200">
                  정해진 기간이 없는 합주 공간
                </p>
              )}
            </div>
            {endBeforeStart && (
              <p className="typo-xs-m text-destructive">
                종료 날짜는 시작 날짜 이후여야 해요.
              </p>
            )}
          </div>

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
        </AppDialogBody>
      </AppDialogContent>
    </Dialog>
  );
};
