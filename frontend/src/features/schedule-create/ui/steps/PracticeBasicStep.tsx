import { Button } from '@/shared/ui/button';
import { DateInput } from '../atoms/DateInput';
import { TimeRangeInput } from '../atoms/TimeRangeInput';
import { PlaceSelect } from '../atoms/PlaceSelect';
import { ScheduleCreateFormState } from '../../model/types';

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
  const isNextDisabled = !data.date || !data.startTime || !data.endTime || !data.placeId;

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="space-y-4">
        <DateInput
          label="언제 연습할까요?"
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
          label="어디서 연습할까요?"
          value={data.placeId}
          onChange={(placeId) => onChange({ placeId })}
        />
      </div>

      <Button
        onClick={onNext}
        disabled={isNextDisabled}
        className="h-12 rounded-xl text-lg font-bold mt-4"
      >
        다음 단계로
      </Button>
    </div>
  );
};
