import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { Schedule } from '@/entities/schedule/model/types';

interface PracticeSpaceItem {
  id: string;
  title: string;
  description: string;
  badgeLabel: string;
  isDestructiveBadge?: boolean;
}

interface TeamPracticeSpaceSectionProps {
  schedules?: Schedule[];
}

const DEFAULT_PRACTICE_SPACES: PracticeSpaceItem[] = [
  {
    id: '1',
    title: '정기 모임',
    description: '정기 연주 및 신곡 연습',
    badgeLabel: '상시',
    isDestructiveBadge: false,
  },
  {
    id: '2',
    title: '봄꽃 축제',
    description: '봄꽃 축제 연주곡 연습',
    badgeLabel: 'D-2',
    isDestructiveBadge: true,
  },
  {
    id: '3',
    title: '2026 하계 공연 무대',
    description: '여름 축제 공연 준비',
    badgeLabel: 'D-90',
    isDestructiveBadge: false,
  },
];

export const TeamPracticeSpaceSection: React.FC<TeamPracticeSpaceSectionProps> = ({
  schedules,
}) => {
  const displayItems: PracticeSpaceItem[] =
    schedules && schedules.length > 0
      ? schedules.map((s, idx) => ({
          id: s.id,
          title: s.title,
          description: s.place?.name || s.type === 'PRACTICE' ? '합주 연습' : '모임',
          badgeLabel: s.type === 'PRACTICE' ? '상시' : `D-${idx + 1}`,
          isDestructiveBadge: idx === 1,
        }))
      : DEFAULT_PRACTICE_SPACES;

  return (
    <div className="bg-[var(--surface\/3,rgba(101,99,122,0.48))] border-[0.667px] border-[var(--greyscale\/500,#28272a)] border-solid content-stretch flex flex-col gap-[12px] items-start p-[20.667px] relative rounded-[20px] w-full">
      <div className="relative shrink-0">
        <p className="font-['SUIT:Bold'] leading-[1.4] not-italic text-white text-[16px] whitespace-nowrap">
          참여중인 합주 공간
        </p>
      </div>
      <div className="relative shrink-0 w-full">
        <div className="content-stretch flex flex-col gap-[6px] items-start justify-center relative w-full">
          {displayItems.map((item, idx) => (
            <div
              key={item.id}
              className={`content-stretch flex gap-[8px] items-center p-[16px] relative shrink-0 w-full hover:bg-white/5 transition-colors rounded-xl cursor-pointer ${
                idx > 0 ? 'border-[var(--greyscale\/500,#28272a)] border-b border-solid' : ''
              }`}
            >
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start justify-center min-w-px relative">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                  <div
                    className={`${
                      item.isDestructiveBadge
                        ? 'bg-[var(--semantic\/destructive\/surface,#fee6e1)]'
                        : 'bg-[var(--greyscale\/100,#dfdfe1)]'
                    } content-stretch flex items-start px-[8px] py-[2px] relative rounded-[999px] shrink-0`}
                  >
                    <p
                      className={`font-['SUIT:SemiBold'] leading-[1.4] not-italic text-[12px] whitespace-nowrap ${
                        item.isDestructiveBadge
                          ? 'text-[color:var(--semantic\/destructive\/main,#d6705c)]'
                          : 'text-black'
                      }`}
                    >
                      {item.badgeLabel}
                    </p>
                  </div>
                  <p className="font-['SUIT:SemiBold'] leading-[1.4] not-italic text-white text-[18px] whitespace-nowrap">
                    {item.title}
                  </p>
                </div>
                <p className="font-['SUIT:Regular'] leading-[1.4] not-italic text-[14px] text-[color:var(--greyscale\/200,#c6c6c8)] whitespace-nowrap">
                  {item.description}
                </p>
              </div>
              <ChevronRight className="size-[24px] text-[color:var(--greyscale\/200,#c6c6c8)] shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
