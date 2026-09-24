import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';
import CalendarIcon from '@/assets/icons/calendar.svg?react';
import { getApiErrorMessage } from '@/shared/api/error';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Field, fieldSurfaceClass } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { MonthCalendar } from '@/shared/ui/month-calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { WheelDatePicker } from '@/shared/ui/wheel-date-picker';
import { WheelFieldCard } from '@/shared/ui/wheel-field-card';
import { WheelTimePicker } from '@/shared/ui/wheel-time-picker';
import { pad2, toWheelDate, type WheelDate } from '@/shared/ui/wheel-date';
import { SCHEDULE_POLL_OPTION_MAX_COUNT } from '@/entities/schedule-poll/model/types';
import { useCreateSchedulePoll } from '../api/use-create-schedule-poll';
import { buildPollOptions, countSlotsPerDay } from '../model/options';

interface SchedulePollCreateFormProps {
  spaceId: string;
  /** 생성 성공 후 호출(투표 목록 이동 등). */
  onCreated: () => void;
}

const TIME_RANGE_ERROR_ID = 'poll-time-range-error';
const OPTION_COUNT_ERROR_ID = 'poll-option-count-error';
const DEADLINE_ERROR_ID = 'poll-deadline-error';

/** WheelDate → '26 - 03 - 01' (시작/종료 시간 카드의 날짜 표기). */
const formatWheelDateShort = (d: WheelDate): string =>
  `${String(d.year).slice(2)} - ${pad2(d.month)} - ${pad2(d.day)}`;

/** WheelDate → '2026. 09. 05.' (마감 기한 버튼 표기). */
const formatWheelDateDot = (d: WheelDate): string =>
  `${d.year}. ${pad2(d.month)}. ${pad2(d.day)}.`;

/** 마감 날짜(WheelDate) + 시각('HH:mm') → ISO 8601(로컬 기준). */
const toClosesAtIso = (date: WheelDate, time: string): string => {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return new Date(
    date.year,
    date.month - 1,
    date.day,
    hour,
    minute,
  ).toISOString();
};

/** 마감 기한 캡슐 버튼(값 + 아이콘). 누르면 팝오버로 휠 피커를 연다. */
const DeadlineTriggerButton = ({
  label,
  value,
  placeholder,
  icon,
  invalid,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  icon: ReactNode;
  invalid?: boolean;
}) => (
  <PopoverTrigger asChild>
    <button
      type="button"
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? DEADLINE_ERROR_ID : undefined}
      className={cn(
        fieldSurfaceClass,
        'flex min-w-0 flex-1 items-center gap-2 outline-1 outline-transparent outline-solid',
        'hover:outline-primary focus-visible:outline-2 focus-visible:outline-primary',
      )}
    >
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-left typo-base-sb',
          value ? 'text-grey-50' : 'text-grey-300',
        )}
      >
        {value ?? placeholder}
      </span>
      {icon}
    </button>
  </PopoverTrigger>
);

/** 일정 투표 생성 폼. 날짜(다중)와 시작~종료 시간을 30분 후보로 펼쳐 생성한다. */
export const SchedulePollCreateForm = ({
  spaceId,
  onCreated,
}: SchedulePollCreateFormProps) => {
  const [dateKeys, setDateKeys] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('17:00');
  const [deadlineDate, setDeadlineDate] = useState<WheelDate | null>(null);
  const [deadlineTime, setDeadlineTime] = useState<string | null>(null);

  const createPoll = useCreateSchedulePoll(spaceId);

  const slotsPerDay = countSlotsPerDay(startTime, endTime);
  const optionCount = dateKeys.length * slotsPerDay;

  const timeRangeInvalid = slotsPerDay === 0;
  const optionCountExceeded = optionCount > SCHEDULE_POLL_OPTION_MAX_COUNT;
  const closesAt =
    deadlineDate !== null && deadlineTime !== null
      ? toClosesAtIso(deadlineDate, deadlineTime)
      : null;
  // 백엔드도 거부하지만, 제출 전에 미리 알 수 있게 인라인으로 막는다.
  const deadlinePast = closesAt !== null && new Date(closesAt) <= new Date();

  const canSubmit =
    dateKeys.length > 0 &&
    name.trim().length > 0 &&
    !timeRangeInvalid &&
    !optionCountExceeded &&
    closesAt !== null &&
    !deadlinePast &&
    !createPoll.isPending;

  const handleSubmit = () => {
    if (!canSubmit || closesAt === null) return;
    createPoll.mutate(
      {
        name: name.trim(),
        closesAt,
        options: buildPollOptions(dateKeys, startTime, endTime),
      },
      {
        onSuccess: () => {
          toast.success('투표가 생성되었습니다');
          onCreated();
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(error, '일정 투표 생성에 실패했어요.'),
          );
        },
      },
    );
  };

  // 시작/종료 시간 카드의 날짜 표기: 첫 선택 날짜(없으면 오늘).
  const firstDate = dateKeys[0]
    ? {
        year: Number(dateKeys[0].slice(0, 4)),
        month: Number(dateKeys[0].slice(5, 7)),
        day: Number(dateKeys[0].slice(8, 10)),
      }
    : toWheelDate(new Date());

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="typo-lg-sb text-grey-50">날짜 선택</h2>
        <p className="typo-sm-r text-grey-200">투표할 날짜를 선택해주세요</p>
      </header>

      <MonthCalendar
        value={dateKeys}
        onChange={setDateKeys}
        minDate={new Date()}
      />

      <Field label="일정 이름" required htmlFor="poll-name">
        <Input
          id="poll-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="투표할 일정 이름을 입력하세요"
          maxLength={40}
          className={cn(fieldSurfaceClass, 'typo-base-sb')}
        />
      </Field>

      <Field label="시작 / 종료 시간" required>
        <WheelFieldCard
          role="group"
          aria-label="시작·종료 시간"
          aria-invalid={timeRangeInvalid || undefined}
          aria-describedby={timeRangeInvalid ? TIME_RANGE_ERROR_ID : undefined}
        >
          {[
            { key: 'start', time: startTime, onChange: setStartTime },
            { key: 'end', time: endTime, onChange: setEndTime },
          ].map(({ key, time, onChange }) => (
            <div
              key={key}
              className="relative z-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-5"
            >
              <span className="min-w-[92px] typo-base-sb text-grey-50">
                {formatWheelDateShort(firstDate)}
              </span>
              <WheelTimePicker value={time} onChange={onChange} />
            </div>
          ))}
        </WheelFieldCard>
        {timeRangeInvalid && (
          <p id={TIME_RANGE_ERROR_ID} className="typo-sm-r text-destructive">
            종료 시간은 시작 시간보다 30분 이상 늦어야 해요.
          </p>
        )}
        {optionCountExceeded && (
          <p id={OPTION_COUNT_ERROR_ID} className="typo-sm-r text-destructive">
            후보 시간은 최대 {SCHEDULE_POLL_OPTION_MAX_COUNT}개까지 만들 수
            있어요. 날짜나 시간 범위를 줄여주세요. (현재 {optionCount}개)
          </p>
        )}
      </Field>

      <Field label="투표 마감 기한" required>
        <div className="flex gap-2">
          {/* 팝오버를 여는 순간 현재 표시값(오늘/19:00)을 상태로 확정해,
              휠을 안 굴리고 닫아도 값이 비지 않게 한다. */}
          <Popover
            onOpenChange={(open) => {
              if (open) setDeadlineDate((d) => d ?? toWheelDate(new Date()));
            }}
          >
            <DeadlineTriggerButton
              label="마감 날짜 선택"
              value={deadlineDate ? formatWheelDateDot(deadlineDate) : null}
              placeholder="날짜 선택"
              invalid={deadlinePast}
              icon={
                <CalendarIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-grey-300"
                />
              }
            />
            <PopoverContent className="w-80 rounded-md bg-gradient-top p-4">
              <WheelDatePicker
                label="마감"
                value={deadlineDate ?? toWheelDate(new Date())}
                onChange={setDeadlineDate}
                minYear={new Date().getFullYear()}
              />
            </PopoverContent>
          </Popover>

          <Popover
            onOpenChange={(open) => {
              if (open) setDeadlineTime((t) => t ?? '19:00');
            }}
          >
            <DeadlineTriggerButton
              label="마감 시간 선택"
              value={deadlineTime}
              placeholder="시간 선택"
              invalid={deadlinePast}
              icon={
                <Clock
                  aria-hidden="true"
                  className="size-5 shrink-0 text-grey-300"
                />
              }
            />
            <PopoverContent className="w-72 rounded-md bg-gradient-top p-4">
              <WheelTimePicker
                value={deadlineTime ?? '19:00'}
                onChange={setDeadlineTime}
              />
            </PopoverContent>
          </Popover>
        </div>
        {deadlinePast && (
          <p id={DEADLINE_ERROR_ID} className="typo-sm-r text-destructive">
            마감 기한은 현재 시각 이후여야 해요.
          </p>
        )}
      </Field>

      <Button
        type="button"
        variant="shining"
        size="lg"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        일정 투표 생성
      </Button>
    </div>
  );
};
