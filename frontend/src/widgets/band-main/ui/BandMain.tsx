import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';
import {
  SegmentedToggle,
  type SegmentedOption,
} from '@/shared/ui/segmented-toggle';
import { WeekDatePicker } from '@/shared/ui/week-date-picker';
import { SpeedDialFab, type SpeedDialAction } from '@/shared/ui/speed-dial-fab';
import { useBandSpaces } from '@/entities/space/api/useBandSpaces';
import { BandSpaceCard } from '@/entities/space/ui/BandSpaceCard';
import { BandNoticeSection } from './BandNoticeSection';

type SpaceFilter = 'mine' | 'inProgress';

const FILTER_OPTIONS: SegmentedOption<SpaceFilter>[] = [
  { value: 'mine', label: '내 공연' },
  { value: 'inProgress', label: '진행 중인 공연' },
];

const FILTER_PARAMS: Record<
  SpaceFilter,
  { onlyMine?: boolean; inProgressOnly?: boolean }
> = {
  mine: { onlyMine: true },
  inProgress: { inProgressOnly: true },
};

export const BandMain = () => {
  const { bandId } = useParams({ from: '/band/$bandId/' });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [filter, setFilter] = useState<SpaceFilter>('mine');
  const { data: spaces, isLoading } = useBandSpaces(
    bandId,
    FILTER_PARAMS[filter],
  );

  // 멤버 초대/새 합주/새 일정은 별도 컨텍스트가 필요해 시각만 우선 구현한다.
  // TODO: 기존 band-invite / space-create / schedule-create 모달과 연결.
  const fabActions: SpeedDialAction[] = [
    { label: '멤버 초대' },
    { label: '새 합주' },
    { label: '새 일정' },
  ];

  const hasSpaces = !!spaces && spaces.length > 0;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex flex-col gap-6 px-8">
        <BandNoticeSection bandId={bandId} />
        <WeekDatePicker value={selectedDate} onChange={setSelectedDate} />
        <SegmentedToggle
          label="공연 필터"
          options={FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <div
        className={cn('flex flex-col', hasSpaces && 'border-t border-grey-500')}
      >
        {isLoading ? (
          <p className="px-8 py-10 text-center typo-sm-r text-grey-300">
            불러오는 중...
          </p>
        ) : hasSpaces ? (
          spaces.map((space) => (
            <BandSpaceCard
              key={space.spaceId}
              bandId={bandId}
              space={space}
              baseDate={selectedDate}
            />
          ))
        ) : (
          <p className="px-8 py-10 text-center typo-sm-r text-grey-300">
            표시할 공연이 없어요.
          </p>
        )}
      </div>

      <SpeedDialFab className="bottom-24" actions={fabActions} />
    </div>
  );
};
