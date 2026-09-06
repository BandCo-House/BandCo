import React from 'react';
import { BandSpaceCard } from '@/entities/space/ui/BandSpaceCard';
import type { Space } from '@/entities/space/model/types';

interface TeamPracticeSpaceSectionProps {
  bandId?: string;
  spaces?: Space[];
}

export const TeamPracticeSpaceSection: React.FC<
  TeamPracticeSpaceSectionProps
> = ({ bandId = 'band-1', spaces = [] }) => {
  if (spaces.length === 0) {
    return (
      <div className="w-full rounded-[20px] border border-[#28272a] bg-[#65637a]/48 p-5 shadow-sm backdrop-blur-md">
        <div className="shrink-0 pb-2">
          <p className="typo-base-b font-bold text-grey-50">
            참여중인 합주 공간
          </p>
        </div>
        <p className="py-2 typo-sm-r text-grey-300">
          참여 중인 합주 공간이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[20px] border border-[#28272a] bg-[#65637a]/48 p-5 shadow-sm backdrop-blur-md">
      <div className="shrink-0 pb-2">
        <p className="typo-base-b font-bold text-grey-50">참여중인 합주 공간</p>
      </div>
      <div className="w-full pt-1">
        <div className="flex w-full flex-col divide-y divide-[#28272a]">
          {spaces.map((space) => (
            <BandSpaceCard key={space.spaceId} bandId={bandId} space={space} />
          ))}
        </div>
      </div>
    </div>
  );
};
