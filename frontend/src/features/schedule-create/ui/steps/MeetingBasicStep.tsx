import { Button } from '@/shared/ui/button';
import { DateInput } from '../atoms/DateInput';
import { TimeRangeInput } from '../atoms/TimeRangeInput';
import { ScheduleCreateFormState } from '../../model/types';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

interface MeetingBasicStepProps {
  data: ScheduleCreateFormState;
  onChange: (updates: Partial<ScheduleCreateFormState>) => void;
  onNext: () => void;
}

export const MeetingBasicStep = ({
  data,
  onChange,
  onNext,
}: MeetingBasicStepProps) => {
  const isNextDisabled = !data.title || !data.date || !data.startTime || !data.endTime;

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">회의 제목</label>
          <Input
            placeholder="회의 제목을 입력해주세요"
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="h-12 rounded-xl border-gray-200"
          />
        </div>

        <DateInput
          label="언제 회의할까요?"
          value={data.date}
          onChange={(date) => onChange({ date })}
        />

        <TimeRangeInput
          startTime={data.startTime}
          endTime={data.endTime}
          onStartTimeChange={(startTime) => onChange({ startTime })}
          onEndTimeChange={(endTime) => onChange({ endTime })}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">회의 메모 (선택)</label>
          <Textarea
            placeholder="회의 관련 메모를 입력해주세요"
            value={data.memo}
            onChange={(e) => onChange({ memo: e.target.value })}
            className="rounded-xl border-gray-200 resize-none min-h-[100px]"
          />
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={isNextDisabled}
        className="h-12 rounded-xl text-lg font-bold mt-4"
      >
        참여자 선택하러 가기
      </Button>
    </div>
  );
};
