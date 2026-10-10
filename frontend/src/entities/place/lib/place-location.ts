import type { Place } from '../model/types';

/** 주소와 상세 위치를 한 줄로 잇는다. 둘 다 없으면 빈 문자열. */
export const getPlaceLocationText = (
  place: Pick<Place, 'address' | 'detailAddress'>,
): string => [place.address, place.detailAddress].filter(Boolean).join(' ');
