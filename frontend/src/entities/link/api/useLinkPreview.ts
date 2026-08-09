import { useQuery } from '@tanstack/react-query';
import { getLinkPreview } from './link-api';

export const linkKeys = {
  all: ['link-previews'] as const,
  preview: (url: string) => [...linkKeys.all, url] as const,
};

/**
 * 링크 미리보기 조회. 같은 URL은 화면 곳곳에서 캐시를 공유한다.
 * 실패해도 첨부 자체는 보여야 하므로 재시도하지 않고 폴백에 맡긴다.
 */
export const useLinkPreview = (url: string) =>
  useQuery({
    queryKey: linkKeys.preview(url),
    queryFn: () => getLinkPreview(url),
    enabled: !!url,
    retry: false,
    staleTime: 60 * 60 * 1000,
  });
