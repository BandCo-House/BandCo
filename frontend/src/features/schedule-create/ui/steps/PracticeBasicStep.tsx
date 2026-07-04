import { Button } from '@/shared/ui/button';
import { DateInput } from '../atoms/DateInput';
import { TimeRangeInput } from '../atoms/TimeRangeInput';
import { PlaceSelect } from '../atoms/PlaceSelect';
import type { ScheduleCreateFormState } from '../../model/types';

interface PracticeBasicStepProps {
  data: ScheduleCreateFormState;
  onChange: (updates: Partial<ScheduleCreateFormState>) => void;
  onNext: () => void;
}

export const PracticeBasicStep = ({
  data,
  onChange,
  onNext,
}: PracticeBasicStepProps) => {
  const isNextDisabled =
    !data.date || !data.startTime || !data.endTime || !data.placeId;

  return (
    <div className="flex flex-col gap-6 py-4">
      <h2 className="typo-xl-sb text-foreground">합주 연습 기본 정보</h2>
      <div className="space-y-4">
        <DateInput
          label="날짜"
          value={data.date}
          onChange={(date) => onChange({ date })}
        />
        <TimeRangeInput
          startTime={data.startTime}
          endTime={data.endTime}
          onStartTimeChange={(startTime) => onChange({ startTime })}
          onEndTimeChange={(endTime) => onChange({ endTime })}
        />
        <PlaceSelect
          label="장소"
          value={data.placeId}
          onChange={(placeId) => onChange({ placeId })}
        />
      </div>

      <Button
        onClick={onNext}
        disabled={isNextDisabled}
        className="typo-lg-b mt-4 h-12 rounded-md"
      >
        다음 단계로
      </Button>
    </div>
  );
};
