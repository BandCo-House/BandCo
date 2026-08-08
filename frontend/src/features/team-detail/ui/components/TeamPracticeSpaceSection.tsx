import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { ScheduleItem } from '@/entities/schedule/model/types';

interface TeamPracticeSpaceSectionProps {
  schedules?: ScheduleItem[];
}

export const TeamPracticeSpaceSection: React.FC<TeamPracticeSpaceSectionProps> = ({
  schedules = [],
}) => {
  if (schedules.length === 0) {
    return (
      <div className="rounded-[20px] border border-[#28272a] bg-[#65637a]/48 p-5 shadow-sm backdrop-blur-md w-full">
        <div className="shrink-0 pb-2">
          <p className="typo-base-b text-grey-50 font-bold">참여중인 합주 공간</p>
        </div>
        <p className="py-2 typo-sm-r text-grey-300">
          참여 중인 합주 공간이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-[#28272a] bg-[#65637a]/48 p-5 shadow-sm backdrop-blur-md w-full">
      <div className="shrink-0 pb-2">
        <p className="typo-base-b text-grey-50 font-bold">참여중인 합주 공간</p>
      </div>
      <div className="w-full pt-1">
        <div className="flex flex-col gap-1.5 w-full">
          {schedules.map((schedule, idx) => {
            const isPractice = schedule.scheduleType === 'PRACTICE';
            return (
              <div
                key={schedule.scheduleId}
                className={`flex gap-2 items-center p-4 w-full hover:bg-white/5 transition-colors rounded-xl cursor-pointer ${
                  idx > 0 ? 'border-b border-[#28272a]' : ''
                }`}
              >
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex gap-2 items-center">
                    <div
                      className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                        !isPractice
                          ? 'bg-[#fee6e1] text-[#d6705c]'
                          : 'bg-[#dfdfe1] text-black'
                      }`}
                    >
                      <span className="typo-xs-sb font-semibold">
                        {isPractice ? '상시' : `D-${idx + 1}`}
                      </span>
                    </div>
                    <p className="typo-base-sb text-grey-50 font-semibold text-[18px]">
                      {schedule.title}
                    </p>
                  </div>
                  <p className="typo-sm-r text-grey-300">
                    {schedule.place?.name || (isPractice ? '합주 연습' : '모임')}
                  </p>
                </div>
                <ChevronRight className="h-6 w-6 text-grey-300 shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
