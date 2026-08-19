import { useQuery } from '@tanstack/react-query';
import { getTrackPreview } from './song-api';

export const trackPreviewKeys = {
  all: ['track-preview'] as const,
  detail: (trackId: string) => [...trackPreviewKeys.all, trackId] as const,
};

/**
 * 외부 트랙의 미리듣기 정보. 목록 응답에 없어 재생을 누른 곡만 조회한다.
 * 트랙 메타는 잘 바뀌지 않으므로 한 번 받아두면 오래 재사용한다.
 */
export const useTrackPreview = (trackId: string | null, enabled: boolean) =>
  useQuery({
    queryKey: trackPreviewKeys.detail(trackId ?? ''),
    queryFn: () => getTrackPreview(trackId as string),
    enabled: enabled && !!trackId,
    staleTime: 30 * 60_000,
  });
