import useEmblaCarousel from 'embla-carousel-react';
import type { Band } from '@/entities/band/model/types';
import { Link } from '@tanstack/react-router';

export interface UserBandsCarouselProps {
  bands: Band[];
}

export function UserBandsCarousel({ bands }: UserBandsCarouselProps) {
  // Embla ref 및 쫀득한 앱 느낌의 dragFree 터치 설정 주입
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  return (
    <div className="flex flex-col rounded-3xl border border-grey-500 bg-[#65637A]/48 p-4 text-grey-50 backdrop-blur-xl transition-all duration-300">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="typo-base-b">소속 밴드</h3>
      </div>

      {/* Embla Viewport (overflow-hidden 및 grab 커서 주입) */}
      <div
        ref={emblaRef}
        className="w-full cursor-grab overflow-hidden active:cursor-grabbing"
      >
        {/* Embla Container (flex gap 구조로 나열) */}
        <div className="flex gap-5 pb-1">
          {bands.map((band) => {
            const bandCoverUrl = 'default-band.png'; // 현재 백엔드 스키마에 밴드 리스트에 이미지가 없음... band.coverImgUrl가 안되니 일단은 기본 이미지로 제공..

            return (
              <Link
                to="/band/$bandId"
                params={{ bandId: band.id }}
                key={band.id}
                className="flex-none rounded-[20px] bg-[#DCE2F9]/40 p-1"
              >
                <div className="h-30 w-30 rounded-[20px]">
                  <img
                    src={bandCoverUrl}
                    alt={band.name}
                    className="h-30 w-30 rounded-[20px] object-cover"
                  />
                </div>
                <div className="mt-4 mb-5 text-center">
                  <h4 className="typo-xs-sb text-grey-50">{band.name}</h4>
                </div>
              </Link>
            );
          })}
        </div>

        {bands.length === 0 && (
          <div className="flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/10 py-10 text-center typo-sm-r text-slate-500">
            소속된 밴드가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
