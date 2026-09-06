import React from 'react';
import { Music, ChevronRight } from 'lucide-react';

export const TeamSongSection: React.FC = () => {
  return (
    <section className="rounded-[20px] border border-[#28272a] bg-[#65637a]/40 p-4 shadow-sm backdrop-blur-md">
      <h3 className="pb-3 typo-base-sb text-grey-100">합주곡</h3>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3d3e54] text-secondary">
              <Music className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="typo-sm-sb text-grey-100">
                마치 흘러가는 바람처럼
              </span>
              <span className="typo-xs-r text-grey-300">DAY6(데이식스)</span>
            </div>
          </div>
          <div className="flex items-center gap-1 typo-xs-r text-grey-300">
            <span>곡 상세</span>
            <ChevronRight className="h-4 w-4 text-grey-300" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3d3e54] text-secondary">
              <Music className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="typo-sm-sb text-grey-100">좋은 날</span>
              <span className="typo-xs-r text-grey-300">IU(아이유)</span>
            </div>
          </div>
          <div className="flex items-center gap-1 typo-xs-r text-grey-300">
            <span>곡 상세</span>
            <ChevronRight className="h-4 w-4 text-grey-300" />
          </div>
        </div>
      </div>
    </section>
  );
};
