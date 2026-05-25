import type { Band } from '@/entities/band/model/types';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';

export interface UserBandsCarouselProps {
  bands: Band[];
}

export function UserBandsCarousel({ bands }: UserBandsCarouselProps) {
  return (
    <div className="space-y-4">
      <h3 className="typo-lg-b text-white">소속 밴드 목록</h3>

      <div className="flex w-full snap-x snap-mandatory overflow-x-auto gap-4 scroll-smooth pb-4 scrollbar-thin scrollbar-thumb-slate-800">
        {bands.map((band) => (
          <div
            key={band.id}
            className="w-[280px] shrink-0 snap-start rounded-2xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/20"
          >
            <div className="mb-4 flex items-center gap-3">
              <Avatar className="size-11 border border-slate-800">
                <AvatarFallback className="bg-gradient-to-tr from-indigo-700 to-violet-700 text-sm font-semibold text-white">
                  {band.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <h4 className="truncate typo-md-b text-white">{band.name}</h4>
                <p className="truncate typo-xs-r text-slate-400">멤버 {band.memberCount}명</p>
              </div>
            </div>

            <p className="mb-4 h-10 overflow-hidden text-ellipsis line-clamp-2 typo-sm-r text-slate-400">
              {band.description || '밴드 소개글이 등록되지 않았습니다.'}
            </p>

            <div className="flex items-center justify-between">
              <span className="rounded-md bg-violet-500/10 px-2 py-0.5 typo-xs-m text-violet-300">
                {band.myRole === 'BM' ? '마스터' : '멤버'}
              </span>
              <span className="typo-xs-r text-slate-500">
                {new Date(band.joinedAt).toLocaleDateString()} 가입
              </span>
            </div>
          </div>
        ))}

        {bands.length === 0 && (
          <div className="flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
            소속된 밴드 목록이 존재하지 않습니다.
          </div>
        )}
      </div>
    </div>
  );
}
