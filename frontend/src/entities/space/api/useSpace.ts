import { useQuery } from '@tanstack/react-query';
import { getSpaceDetail } from './space-api';

export const spaceDetailKeys = {
  all: ['space-detail'] as const,
  detail: (spaceId: string) => [...spaceDetailKeys.all, spaceId] as const,
};

/**
 * 공간 상세(헤더 요약: 이름/설명 + 멤버 수/곡 수)를 조회한다.
 */
export const useSpace = (spaceId: string) =>
  useQuery({
    queryKey: spaceDetailKeys.detail(spaceId),
    queryFn: () => getSpaceDetail(spaceId),
    enabled: !!spaceId,
  });
