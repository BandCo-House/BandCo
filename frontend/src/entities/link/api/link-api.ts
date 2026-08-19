import { apiGet } from '@/shared/api';
import { linkPreviewSchema } from '../model/schema';
import type { LinkPreview } from '../model/types';

/** 외부 링크의 og 메타를 서버를 통해 읽는다. */
export const getLinkPreview = async (url: string): Promise<LinkPreview> => {
  const data = await apiGet<unknown>('/link-previews', { params: { url } });
  return linkPreviewSchema.parse(data);
};
