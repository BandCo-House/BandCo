import { Inject, Injectable } from '@nestjs/common';

import type { LinkPreview } from './types/link-preview.type';
import { LINK_PREVIEW_READER, type LinkPreviewReader } from './link-preview-http.client';
import { isYoutubeUrl, YOUTUBE_LINK_PREVIEW_READER } from './youtube-oembed.client';

@Injectable()
export class LinkPreviewsService {
  constructor(
    @Inject(LINK_PREVIEW_READER)
    private readonly linkPreviewReader: LinkPreviewReader,
    @Inject(YOUTUBE_LINK_PREVIEW_READER)
    private readonly youtubeLinkPreviewReader: LinkPreviewReader,
  ) {}

  /**
   * 외부 페이지를 읽지 못해도 원본 URL과 비어 있는 메타데이터를 반환한다.
   * 유튜브 링크는 HTML에서 제목을 읽을 수 없어 oEmbed로 읽는다.
   *
   * @param {string} url - 미리보기를 조회할 절대 URL
   * @returns {Promise<LinkPreview>} 프론트 폴백이 가능한 링크 미리보기
   */
  async getLinkPreview(url: string): Promise<LinkPreview> {
    const reader = isYoutubeUrl(url) ? this.youtubeLinkPreviewReader : this.linkPreviewReader;

    try {
      const metadata = await reader.readLinkPreview(url);
      return { url, ...metadata };
    } catch {
      return {
        url,
        title: null,
        siteName: null,
        faviconUrl: null,
        imageUrl: null,
        authorName: null,
      };
    }
  }
}
