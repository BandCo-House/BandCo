import { useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';
import CalendarIcon from '@/assets/icons/calendar.svg?react';
import { getApiErrorMessage } from '@/shared/api/error';
import { addDays } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Field, fieldSurfaceClass } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { SelectField } from '@/shared/ui/select-field';
import { MonthCalendar } from '@/shared/ui/month-calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { WheelDatePicker } from '@/shared/ui/wheel-date-picker';
import { WheelTimePicker } from '@/shared/ui/wheel-time-picker';
import { pad2, toWheelDate, type WheelDate } from '@/shared/ui/wheel-date';
import { SCHEDULE_POLL_OPTION_MAX_COUNT } from '@/entities/schedule-poll/model/types';
import { formatDateRanges } from '@/entities/schedule-poll/lib/poll-grid';
import { useCreateSchedulePoll } from '../api/use-create-schedule-poll';
import {
  START_TIME_OPTIONS,
  buildPollOptions,
  buildSlotLabels,
  countSlotsPerDay,
  endTimeOptions,
  shiftEndTime,
} from '../model/options';

interface SchedulePollCreateFormProps {
  spaceId: string;
  /** 생성 성공 후 호출(투표 목록 이동 등). */
  onCreated: () => void;
}

const DEADLINE_ERROR_ID = 'poll-deadline-error';

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

/** 'HH:mm' 목록을 셀렉트 옵션으로. 라벨은 격자 행과 같은 24시간 표기로 맞춘다. */
const toTimeOptions = (times: string[]) =>
  times.map((time) => ({ value: time, label: time }));

/** 한 줄에 보여줄 후보 시각 개수. 넘으면 말줄임으로 접는다. */
const PREVIEW_SLOT_LIMIT = 5;

/**
 * 고른 날짜·시간 범위로 실제 무엇이 만들어지는지 보여주는 미리보기.
 * "30분 단위 후보"라는 설명만으로는 감이 오지 않아, 생성될 값을 그대로 보여준다.
 */
const SlotPreview = ({
  dateKeys,
  slotLabels,
  optionCount,
  exceeded,
}: {
  dateKeys: string[];
  slotLabels: string[];
  optionCount: number;
  exceeded: boolean;
}) => {
  if (dateKeys.length === 0 || slotLabels.length === 0) return null;

  const shown = slotLabels.slice(0, PREVIEW_SLOT_LIMIT);
  const restCount = slotLabels.length - shown.length;

  return (
    <div className="flex flex-col gap-1.5 rounded-sm bg-surface-3 px-4 py-3">
      <p className="typo-xs-sb text-grey-100">이렇게 만들어져요</p>
      <p className="typo-xs-r text-grey-200">
        {formatDateRanges(dateKeys).join(', ')}
      </p>
      <p className="typo-xs-r text-grey-200">
        {shown.join(' · ')}
        {restCount > 0 ? ` 외 ${restCount}개` : ''}
      </p>
      <p
        className={cn(
          'typo-xs-sb',
          exceeded ? 'text-destructive' : 'text-grey-100',
        )}
      >
        날짜 {dateKeys.length}일 × 하루 {slotLabels.length}칸 = 후보{' '}
        {optionCount}개
        {exceeded ? ` (최대 ${SCHEDULE_POLL_OPTION_MAX_COUNT}개)` : ''}
      </p>
    </div>
  );
};

/** 마감 기한 캡슐 버튼(값 + 아이콘). 누르면 팝오버로 휠 피커를 연다. */
const DeadlineTriggerButton = ({
  label,
  value,
  icon,
  invalid,
}: {
  label: string;
  value: string;
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
      <span className="min-w-0 flex-1 truncate text-left typo-base-sb text-grey-50">
        {value}
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
  // 마감 기한은 대부분 기본값으로 충분해 접어 둔다. '변경'을 눌렀을 때만 피커를 편다.
  const [customDeadline, setCustomDeadline] = useState<{
    date: WheelDate;
    time: string;
  } | null>(null);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);

  const createPoll = useCreateSchedulePoll(spaceId);

  // 렌더 순수성 규칙 때문에 현재 시각은 마운트 시점에 한 번만 잡는다(기본값·과거 판정 기준).
  const [openedAt] = useState(() => Date.now());

  // 기본 마감: 첫 후보 날짜 전날 19:00. 그게 이미 지났으면(후보가 코앞) 한 시간 뒤로 민다.
  const defaultDeadline = useMemo(() => {
    const firstDate = dateKeys[0];
    const base = firstDate
      ? new Date(
          Number(firstDate.slice(0, 4)),
          Number(firstDate.slice(5, 7)) - 1,
          Number(firstDate.slice(8, 10)),
        )
      : addDays(new Date(openedAt), 2);
    const dayBefore = addDays(base, -1);
    dayBefore.setHours(19, 0, 0, 0);

    const soonest = new Date(openedAt + 60 * 60 * 1000);
    const resolved = dayBefore > soonest ? dayBefore : soonest;
    return {
      date: toWheelDate(resolved),
      time: `${pad2(resolved.getHours())}:${pad2(resolved.getMinutes())}`,
    };
  }, [dateKeys, openedAt]);

  const deadline = customDeadline ?? defaultDeadline;
  const deadlineDate = deadline.date;
  const deadlineTime = deadline.time;

  const slotsPerDay = countSlotsPerDay(startTime, endTime);
  const optionCount = dateKeys.length * slotsPerDay;
  const slotLabels = buildSlotLabels(startTime, endTime);

  const timeRangeInvalid = slotsPerDay === 0;
  const optionCountExceeded = optionCount > SCHEDULE_POLL_OPTION_MAX_COUNT;
  const closesAt = toClosesAtIso(deadlineDate, deadlineTime);
  // 백엔드도 거부하지만, 제출 전에 미리 알 수 있게 인라인으로 막는다.
  const deadlinePast = new Date(closesAt).getTime() <= openedAt;

  // 후보 개수 초과는 날짜×시간 조합의 결과라 어느 칸의 잘못인지 특정할 수 없다.
  // 버튼을 잠그면 이유를 알 수 없으니, 누를 수는 있게 두고 제출 시 toast로 알린다.
  const canSubmit =
    dateKeys.length > 0 &&
    name.trim().length > 0 &&
    !timeRangeInvalid &&
    !deadlinePast &&
    !createPoll.isPending;

  // 시작을 옮기면 기존 길이를 유지한 채 끝도 따라 옮긴다(끝이 시작보다 빨라지는 상태를 만들지 않는다).
  const handleStartTimeChange = (nextStart: string) => {
    setEndTime((prevEnd) => shiftEndTime(startTime, prevEnd, nextStart));
    setStartTime(nextStart);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (optionCountExceeded) {
      toast.error(
        `후보는 최대 ${SCHEDULE_POLL_OPTION_MAX_COUNT}개까지 만들 수 있어요. 날짜나 시간 범위를 줄여주세요. (현재 ${optionCount}개)`,
      );
      return;
    }
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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="typo-lg-sb text-grey-50">날짜 선택</h2>
        <p className="typo-sm-r text-grey-200">
          멤버들이 가능한 시간을 고를 수 있게 후보 날짜를 정해요
        </p>
      </header>

      <MonthCalendar
        value={dateKeys}
        onChange={setDateKeys}
        minDate={new Date(openedAt)}
      />

      <Field label="후보 시간 범위" required>
        {/* '시작/종료 시간'은 투표 자체의 기간으로 읽혀 마감 기한과 헷갈린다.
            이 값은 "몇 시부터 몇 시까지를 후보로 둘지"다. */}
        <p className="typo-sm-r text-grey-200">
          고른 날짜마다 이 범위를 30분씩 쪼개 후보로 만들어요
        </p>
        <div className="flex items-center gap-2">
          <SelectField
            ariaLabel="후보 시작 시각"
            value={startTime}
            onValueChange={handleStartTimeChange}
            options={toTimeOptions(START_TIME_OPTIONS)}
            placeholder="시작"
          />
          <span
            aria-hidden="true"
            className="shrink-0 typo-base-sb text-grey-300"
          >
            ~
          </span>
          <SelectField
            ariaLabel="후보 끝 시각"
            value={endTime}
            onValueChange={setEndTime}
            options={toTimeOptions(endTimeOptions(startTime))}
            placeholder="끝"
          />
        </div>
        <SlotPreview
          dateKeys={dateKeys}
          slotLabels={slotLabels}
          optionCount={optionCount}
          exceeded={optionCountExceeded}
        />
      </Field>

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

      <Field label="투표 마감 기한" required>
        <p className="typo-sm-r text-grey-200">
          이 시각이 지나면 투표할 수 없어요
        </p>

        {isEditingDeadline ? (
          <div className="flex gap-2">
            <Popover>
              <DeadlineTriggerButton
                label="마감 날짜 선택"
                value={formatWheelDateDot(deadlineDate)}
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
                  value={deadlineDate}
                  onChange={(date) =>
                    setCustomDeadline({ date, time: deadlineTime })
                  }
                  minYear={new Date(openedAt).getFullYear()}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <DeadlineTriggerButton
                label="마감 시간 선택"
                value={deadlineTime}
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
                  value={deadlineTime}
                  onChange={(time) =>
                    setCustomDeadline({ date: deadlineDate, time })
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div
            className={cn(
              fieldSurfaceClass,
              'flex items-center justify-between gap-3',
            )}
          >
            <p className="min-w-0 truncate typo-base-sb text-grey-50">
              {formatWheelDateDot(deadlineDate)} {deadlineTime}
            </p>
            <button
              type="button"
              onClick={() => setIsEditingDeadline(true)}
              className="-m-2 shrink-0 p-2 typo-sm-sb text-grey-300 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
            >
              변경
            </button>
          </div>
        )}

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
