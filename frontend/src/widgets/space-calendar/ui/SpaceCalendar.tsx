import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { WEEKDAY_LABELS, addDays } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { useSpace } from '@/entities/space/api/useSpace';
import {
  useDaySchedules,
  useMonthScheduleCounts,
} from '@/entities/schedule/model/queries';
import { SpaceSummaryHeader } from '@/entities/space/ui/SpaceSummaryHeader';
import { ScheduleFilterBar } from '@/features/schedule-filter/ui/ScheduleFilterBar';
import { ScheduleFilterSheet } from '@/features/schedule-filter/ui/ScheduleFilterSheet';
import {
  EMPTY_DETAIL_FILTER,
  type ScheduleDetailFilter,
  type ScheduleTypeFilter,
} from '@/features/schedule-filter/model/types';
import { ScheduleCreateModal } from '@/features/schedule-create/ui/ScheduleCreateModal';
import { MonthDatePicker } from '@/shared/ui/month-date-picker';
import { WeekDateStrip } from '@/shared/ui/week-date-picker';
import { SpeedDialFab, type SpeedDialAction } from '@/shared/ui/speed-dial-fab';
import { CalendarNav, type CalendarView } from './CalendarNav';
import { DayTimeline } from './DayTimeline';

const formatCompactDate = (date: Date): string =>
  `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_LABELS[date.getDay()]})`;

// 헤더를 아직 못 쟀을 때(첫 페인트) 쓰는 폴백. 앱바(60~64) + 공간 탭 높이의 어림값이다.
// 실제 헤더는 safe area를 포함하고 제목 줄바꿈에 따라 커지므로 이 값에 기대면 안 된다 —
// 노치 기기에선 실제 높이가 168px쯤이라 필터 바가 헤더 뒤로 들어갔다.
const HEADER_FALLBACK_PX = 120;

/** 합주 공간 메인. 주별/월별 날짜 선택 + 고른 하루의 타임라인. */
export const SpaceCalendar = () => {
  const { spaceId, bandId } = useParams({ strict: false });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [scheduleType, setScheduleType] =
    useState<ScheduleTypeFilter>(undefined);
  const [onlyMine, setOnlyMine] = useState(false);
  const [detailFilter, setDetailFilter] =
    useState<ScheduleDetailFilter>(EMPTY_DETAIL_FILTER);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 일정 카드를 눌러 연 경우에만 채워진다. 비어 있으면 모달은 '추가' 폼으로 열린다.
  const [detailScheduleId, setDetailScheduleId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // 고정 헤더(RouteHeader)의 실제 높이. sticky top과 관찰 기준선이 같은 값을 봐야
  // 필터 바가 헤더 뒤로 들어가거나 전환 시점이 어긋나지 않는다.
  const [headerPx, setHeaderPx] = useState(HEADER_FALLBACK_PX);
  useLayoutEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    const sync = () => setHeaderPx(header.getBoundingClientRect().height);

    sync();
    const resizeObserver = new ResizeObserver(sync);
    resizeObserver.observe(header);
    return () => resizeObserver.disconnect();
  }, []);

  // 필터가 헤더에 고정되는 순간에만 collapsed로 전환(고정 후 배경이 떠 겹침 방지).
  const stickSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stickSentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      { rootMargin: `-${headerPx}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [headerPx]);

  const { data: spaceDetail } = useSpace(spaceId ?? '');
  const scheduleFilter = {
    scheduleType,
    onlyMine,
    songIds: detailFilter.songIds,
    placeIds: detailFilter.placeIds,
    teamIds: detailFilter.teamIds,
  };
  const { data: blocks = [] } = useDaySchedules(spaceId ?? '', {
    date: selectedDate,
    ...scheduleFilter,
  });
  // 점은 타임라인과 같은 필터를 받는다 — 점이 있는 날을 눌렀는데 비어 있으면 안 된다.
  const { data: monthCounts } = useMonthScheduleCounts(
    spaceId ?? '',
    { month: selectedDate, ...scheduleFilter },
    { enabled: calendarView === 'month' },
  );

  const fabActions: SpeedDialAction[] = [
    {
      label: '새 일정',
      onClick: () => {
        setDetailScheduleId(null);
        setIsModalOpen(true);
      },
    },
  ];

  const handleScheduleClick = (scheduleId: string) => {
    setDetailScheduleId(scheduleId);
    setIsModalOpen(true);
  };

  const detailFilterActive =
    detailFilter.songIds.length > 0 ||
    detailFilter.placeIds.length > 0 ||
    detailFilter.teamIds.length > 0;

  return (
    <div className="flex w-full flex-col pb-[calc(5rem_+_env(safe-area-inset-bottom))]">
      <div className="flex flex-col gap-6 px-5">
        {spaceDetail && (
          <SpaceSummaryHeader
            name={spaceDetail.space.name}
            description={spaceDetail.space.description}
            memberCount={spaceDetail.memberCount}
            songCount={spaceDetail.songCount}
          />
        )}
        <section className="flex flex-col gap-5">
          <CalendarNav
            view={calendarView}
            onViewChange={setCalendarView}
            value={selectedDate}
            onChange={setSelectedDate}
          />
          {calendarView === 'month' ? (
            <MonthDatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              markers={monthCounts}
              markerLabel="일정"
            />
          ) : (
            <WeekDateStrip value={selectedDate} onChange={setSelectedDate} />
          )}
        </section>
      </div>

      <div ref={stickSentinelRef} className="h-0" />

      {/* 고정될 때만 헤더와 같은 프로스트 + 상단 글로우로 한 덩어리처럼 이어진다.
          (합주 메인은 앱바 글로우를 끄고, 스크롤로 고정될 때 이 바가 글로우를 담당한다.) */}
      <div
        className={cn(
          'sticky z-20 flex flex-col gap-3 px-5 py-3',
          collapsed && 'bg-gradient-top/65 header-glow backdrop-blur-sm',
        )}
        style={{ top: headerPx - 1 }}
      >
        {collapsed && (
          <div className="flex items-center justify-between">
            <p className="typo-lg-sb text-grey-50">
              {formatCompactDate(selectedDate)}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="이전 날"
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                className="inline-flex size-7 items-center justify-center rounded-full text-grey-300 focus-visible:outline-2 focus-visible:outline-key"
              >
                <ArrowRightIcon
                  aria-hidden="true"
                  className="size-4 rotate-180"
                />
              </button>
              <button
                type="button"
                aria-label="다음 날"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="inline-flex size-7 items-center justify-center rounded-full text-grey-300 focus-visible:outline-2 focus-visible:outline-key"
              >
                <ArrowRightIcon aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        )}

        <ScheduleFilterBar
          scheduleType={scheduleType}
          onScheduleTypeChange={setScheduleType}
          onlyMine={onlyMine}
          onOnlyMineChange={setOnlyMine}
          onDetailFilterOpen={() => setIsFilterSheetOpen(true)}
          detailFilterActive={detailFilterActive}
        />
      </div>

      <DayTimeline
        className="mt-2"
        blocks={blocks}
        onScheduleClick={handleScheduleClick}
      />

      <SpeedDialFab
        className="bottom-24"
        actions={fabActions}
        hidden={isModalOpen || isFilterSheetOpen}
      />

      <ScheduleFilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        bandId={bandId ?? ''}
        value={detailFilter}
        onApply={setDetailFilter}
      />

      <ScheduleCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        spaceId={spaceId ?? ''}
        bandId={bandId ?? ''}
        initialDate={selectedDate}
        onSaved={setSelectedDate}
        initialScheduleId={detailScheduleId}
      />
    </div>
  );
};
