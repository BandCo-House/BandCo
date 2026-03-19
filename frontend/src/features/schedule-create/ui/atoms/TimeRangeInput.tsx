import { Clock } from 'lucide-react';
import { useId } from 'react';

interface TimeRangeInputProps {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

export const TimeRangeInput = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: TimeRangeInputProps) => {
  const startId = useId();
  const endId = useId();

  // 간단한 시간 리스트 생성 (00:00 ~ 23:30, 30분 단위)
  const timeOptions = Array.from({ length: 48 }).map((_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mt-2">
        <div className="flex flex-col gap-1 flex-1">
          <label htmlFor={startId} className="text-sm font-medium text-gray-700">시작 시간</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
            <select
              id={startId}
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {timeOptions.map((time) => (
                <option key={`start-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>
        <span className="text-gray-400 mt-6">~</span>
        <div className="flex flex-col gap-1 flex-1">
          <label htmlFor={endId} className="text-sm font-medium text-gray-700">종료 시간</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
            <select
              id={endId}
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {timeOptions.map((time) => (
                <option key={`end-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
