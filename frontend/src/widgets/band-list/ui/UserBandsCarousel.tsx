import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { Band } from '@/entities/band/model/types';
import { Link } from '@tanstack/react-router';

export interface UserBandsCarouselProps {
  bands: Band[];
}

export function UserBandsCarousel({ bands }: UserBandsCarouselProps) {
  // Embla ref 및 쫀득한 앱 느낌의 dragFree 터치 설정 주입
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const frameId = window.requestAnimationFrame(updateScrollState);
    emblaApi.on('select', updateScrollState);
    emblaApi.on('reInit', updateScrollState);

    return () => {
      window.cancelAnimationFrame(frameId);
      emblaApi.off('select', updateScrollState);
      emblaApi.off('reInit', updateScrollState);
    };
  }, [emblaApi, updateScrollState]);

  return (
    <section
      aria-labelledby="profile-bands-title"
      className="flex flex-col items-start gap-2.5 self-stretch rounded-xl bg-surface-3 p-4 text-grey-50"
    >
      <h2 id="profile-bands-title" className="typo-base-b">
        소속 밴드
      </h2>

      <div className="relative w-full">
        <div
          ref={emblaRef}
          className="w-full cursor-grab overflow-hidden active:cursor-grabbing"
        >
          <div className="flex gap-2 pb-1">
            {bands.map((band) => {
              const bandCoverUrl = 'default-band.png'; // 현재 백엔드 스키마에 밴드 리스트에 이미지가 없음... band.coverImgUrl가 안되니 일단은 기본 이미지로 제공..

              return (
                <Link
                  to="/band/$bandId"
                  params={{ bandId: band.id }}
                  key={band.id}
                  className="flex-none rounded-xl bg-surface-1/40 px-1 pt-1 pb-5 shadow-[0_2px_3px_1px_rgba(0,0,0,0.10)] outline-[0.5px] -outline-offset-1 outline-grey-50"
                >
                  <div className="flex size-32 items-center justify-center overflow-hidden rounded-xl bg-grey-200">
                    <img
                      src={bandCoverUrl}
                      alt={band.name}
                      className="size-full rounded-xl object-cover"
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="max-w-32 truncate typo-xs-sb text-grey-50">
                      {band.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>

          {bands.length === 0 && (
            <div className="flex w-full items-center justify-center rounded-2xl border border-dashed border-grey-50/24 bg-white/8 py-10 text-center typo-sm-r text-grey-300">
              소속된 밴드가 없습니다.
            </div>
          )}
        </div>
        {canScrollPrev && (
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-14 bg-linear-to-l from-transparent to-[#393951]" />
        )}
        {canScrollNext && (
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-14 bg-linear-to-r from-transparent to-[#393951]" />
        )}
      </div>
    </section>
  );
}
