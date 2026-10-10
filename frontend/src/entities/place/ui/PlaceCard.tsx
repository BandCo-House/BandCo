import { getPlaceLocationText } from '../lib/place-location';
import type { Place } from '../model/types';

interface PlaceCardProps {
  place: Place;
  /** 카드를 누르면 상세를 연다. */
  onClick: () => void;
}

/**
 * 라이브러리 연습 장소 카드. 장소명 + 위치를 surface 카드 위에 표시한다.
 * 카드 전체가 버튼이라 안쪽은 span으로 둔다(button 안에는 p·div를 둘 수 없다).
 */
export const PlaceCard = ({ place, onClick }: PlaceCardProps) => {
  const location = getPlaceLocationText(place);

  return (
    <button
      type="button"
      onClick={onClick}
      // 두 줄이 이어 붙어 "연습실 A서울특별시…"로 읽히지 않게 이름을 따로 준다.
      aria-label={location ? `${place.name}, ${location}` : place.name}
      className="flex size-full flex-col justify-center gap-1 rounded-md bg-surface-3 px-4 py-5 text-left focus-visible:outline-2 focus-visible:outline-primary"
    >
      <span className="w-full truncate typo-base-sb text-grey-50">
        {place.name}
      </span>
      {location && (
        <span className="w-full truncate typo-xs-r text-grey-200">
          {location}
        </span>
      )}
    </button>
  );
};
