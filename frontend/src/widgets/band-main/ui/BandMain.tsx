import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';
import {
  SegmentedToggle,
  type SegmentedOption,
} from '@/shared/ui/segmented-toggle';
import { WeekDatePicker } from '@/shared/ui/week-date-picker';
import { SpeedDialFab, type SpeedDialAction } from '@/shared/ui/speed-dial-fab';
import { useBandSpaces } from '@/entities/space/api/useBandSpaces';
import { BandSpaceCard } from '@/entities/space/ui/BandSpaceCard';
import { SpaceCreateModal } from '@/features/space-create/ui/SpaceCreateModal';
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
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [filter, setFilter] = useState<SpaceFilter>('mine');
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const { data: spaces, isLoading } = useBandSpaces(
    bandId,
    FILTER_PARAMS[filter],
  );

  // 멤버 초대는 전용 모달 대신 초대 UI가 이미 있는 밴드 설정으로 보낸다.
  const fabActions: SpeedDialAction[] = [
    {
      label: '멤버 초대',
      onClick: () =>
        navigate({ to: '/band/$bandId/settings', params: { bandId } }),
    },
    { label: '새 합주', onClick: () => setIsSpaceModalOpen(true) },
  ];

  const hasSpaces = !!spaces && spaces.length > 0;

  return (
    <div className="flex flex-col gap-6 pt-8">
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

      <SpaceCreateModal
        open={isSpaceModalOpen}
        onOpenChange={setIsSpaceModalOpen}
        bandId={bandId}
      />
    </div>
  );
};
