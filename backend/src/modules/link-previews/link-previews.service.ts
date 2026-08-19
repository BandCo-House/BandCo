import { Inject, Injectable } from '@nestjs/common';

import type { LinkPreview } from './types/link-preview.type';
import { LINK_PREVIEW_READER, type LinkPreviewReader } from './link-preview-http.client';

@Injectable()
export class LinkPreviewsService {
  constructor(
    @Inject(LINK_PREVIEW_READER)
    private readonly linkPreviewReader: LinkPreviewReader,
  ) {}

  /**
   * 외부 페이지를 읽지 못해도 원본 URL과 비어 있는 메타데이터를 반환한다.
   *
   * @param {string} url - 미리보기를 조회할 절대 URL
   * @returns {Promise<LinkPreview>} 프론트 폴백이 가능한 링크 미리보기
   */
  async getLinkPreview(url: string): Promise<LinkPreview> {
    try {
      const metadata = await this.linkPreviewReader.readLinkPreview(url);
      return { url, ...metadata };
    } catch {
      return {
        url,
        title: null,
        siteName: null,
        faviconUrl: null,
      };
    }
  }
}
