import type { Band } from '@/entities/band/model/types';

export interface UserBandsCarouselProps {
  bands: Band[];
}

export function UserBandsCarousel({ bands }: UserBandsCarouselProps) {
  return (
    <div className="space-y-4">
      <h3 className="typo-sm-b text-slate-400 tracking-wider">소속 밴드</h3>

      <div className="flex w-full snap-x snap-mandatory overflow-x-auto gap-5 scroll-smooth pb-4 scrollbar-none">
        {bands.map((band) => {
          // 시안의 감각적인 합주 장비 및 무대 연출 이미지에 부합하는 Unsplash 썸네일 고화질 큐레이션 매칭
          const bandCoverUrl = 
            band.name.includes('신촌') 
              ? 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=300&q=80' // 합주 장비 이미지
              : band.name.includes('홍대')
                ? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80' // 몽환적 조명 아래 드럼/연주
                : undefined;

          return (
            <div
              key={band.id}
              className="relative aspect-square w-48 shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-lg transition-all duration-500 hover:scale-[1.03] hover:border-violet-500/30 group cursor-pointer"
            >
              {/* Band Cover Image or Fallback Neon Gradient */}
              {bandCoverUrl ? (
                <img
                  src={bandCoverUrl}
                  alt={band.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 opacity-90 flex items-center justify-center">
                  <span className="typo-3xl-b text-violet-500/40">{band.name.charAt(0)}</span>
                </div>
              )}

              {/* Bottom Glassmorphic Band Info Bar */}
              <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 border-t border-white/5 backdrop-blur-md py-3 px-4 flex flex-col justify-center gap-0.5">
                <h4 className="truncate typo-sm-b text-slate-100 font-semibold">{band.name}</h4>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>멤버 {band.memberCount}명</span>
                  <span className="text-violet-400 font-medium">
                    {band.myRole === 'BM' ? '마스터' : '멤버'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {bands.length === 0 && (
          <div className="flex w-full items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 py-12 text-center text-slate-500 typo-sm-r">
            소속된 밴드가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
