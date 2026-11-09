import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';
import {
  SegmentedToggle,
  type SegmentedOption,
} from '@/shared/ui/segmented-toggle';
import { WeekDatePicker } from '@/shared/ui/week-date-picker';
import { ActionFab } from '@/shared/ui/action-fab';
import { useBandSpaces } from '@/entities/space/api/useBandSpaces';
import { BandSpaceCard } from '@/entities/space/ui/BandSpaceCard';
import { SpaceCreateModal } from '@/features/space-create/ui/SpaceCreateModal';
import { AssistantPanel } from '@/features/assistant-query';
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
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const { data: spaces, isLoading } = useBandSpaces(
    bandId,
    FILTER_PARAMS[filter],
  );

  const hasSpaces = !!spaces && spaces.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 px-5">
        <BandNoticeSection bandId={bandId} />
        <AssistantPanel bandId={bandId} />
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
          <p className="px-5 py-10 text-center typo-sm-r text-grey-300">
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
          <p className="px-5 py-10 text-center typo-sm-r text-grey-300">
            표시할 공연이 없어요.
          </p>
        )}
      </div>

      {/* 멤버 초대는 FAB에서 빼고 헤더 설정(초대 카드가 있는 곳)으로만 들어간다. */}
      <ActionFab
        className="bottom-24"
        label="새 합주"
        onClick={() => setIsSpaceModalOpen(true)}
        hidden={isSpaceModalOpen}
      />

      <SpaceCreateModal
        open={isSpaceModalOpen}
        onOpenChange={setIsSpaceModalOpen}
        bandId={bandId}
      />
    </div>
  );
};
