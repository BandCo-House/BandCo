import type { Place } from '../model/types';

interface PlaceCardProps {
  place: Place;
}

/**
 * 라이브러리 연습 장소 카드. 장소명 + 주소를 surface 카드 위에 표시한다.
 */
export const PlaceCard = ({ place }: PlaceCardProps) => (
  <div className="flex flex-col justify-center gap-1 rounded-md bg-surface-3 px-4 py-5">
    <p className="truncate typo-base-sb text-grey-50">{place.name}</p>
    <p className="truncate typo-xs-r text-grey-200">{place.address}</p>
  </div>
);
