import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';
import { Checkbox } from '@/shared/ui/checkbox';
import { WeekDatePicker } from '@/shared/ui/week-date-picker';
import { ActionFab } from '@/shared/ui/action-fab';
import { useBandSpaces } from '@/entities/space/api/useBandSpaces';
import { BandSpaceCard } from '@/entities/space/ui/BandSpaceCard';
import { SpaceCreateModal } from '@/features/space-create/ui/SpaceCreateModal';
import { BandNoticeSection } from './BandNoticeSection';

const ONLY_MINE_ID = 'band-spaces-only-mine';

export const BandMain = () => {
  const { bandId } = useParams({ from: '/band/$bandId/' });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  // 기본은 밴드의 합주 전체. 예전 "내 공연 / 진행 중인 공연" 토글은 둘 중 하나만 골라야 해서,
  // 내가 빠진 끝난 합주는 어디에서도 볼 수 없었다.
  const [onlyMine, setOnlyMine] = useState(false);
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const { data: spaces, isLoading } = useBandSpaces(
    bandId,
    onlyMine ? { onlyMine: true } : {},
  );

  const hasSpaces = !!spaces && spaces.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 px-5">
        <BandNoticeSection bandId={bandId} />
        <WeekDatePicker value={selectedDate} onChange={setSelectedDate} />
        <div className="flex items-center gap-2">
          <Checkbox
            id={ONLY_MINE_ID}
            checked={onlyMine}
            onCheckedChange={(checked) => setOnlyMine(checked === true)}
          />
          <label htmlFor={ONLY_MINE_ID} className="typo-sm-sb text-grey-100">
            내가 참여한 합주만 보기
          </label>
        </div>
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
            표시할 합주가 없어요.
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
