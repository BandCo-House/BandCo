import { Injectable } from '@nestjs/common';

import type { LinkPreviewMetadata } from './types/link-preview.type';
import type { LinkPreviewReader } from './link-preview-http.client';

export const YOUTUBE_LINK_PREVIEW_READER = Symbol('YOUTUBE_LINK_PREVIEW_READER');

const YOUTUBE_OEMBED_API_URL = 'https://www.youtube.com/oembed';
const YOUTUBE_FAVICON_URL = 'https://www.youtube.com/favicon.ico';
const REQUEST_TIMEOUT_MS = 5_000;
const YOUTUBE_HOSTNAMES = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be']);

interface YoutubeOembedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

/**
 * 유튜브 영상 링크인지 확인한다.
 * 유튜브 페이지는 HTML head에서 제목을 읽을 수 없어, 이 링크만 oEmbed로 따로 읽는다.
 *
 * @param {string} url - 확인할 절대 URL
 * @returns {boolean} 유튜브 호스트의 URL이면 true
 */
export function isYoutubeUrl(url: string): boolean {
  try {
    return YOUTUBE_HOSTNAMES.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

@Injectable()
export class YoutubeOembedClient implements LinkPreviewReader {
  /**
   * 유튜브 oEmbed로 영상 제목·채널 이름·썸네일을 읽는다.
   * 요청 대상이 유튜브 oEmbed 주소로 고정되어 있어 임의 URL을 서버가 직접 요청하지 않는다.
   *
   * @param {string} url - 유튜브 영상 URL
   * @returns {Promise<LinkPreviewMetadata>} 영상 메타데이터
   */
  async readLinkPreview(url: string): Promise<LinkPreviewMetadata> {
    const oembedUrl = new URL(YOUTUBE_OEMBED_API_URL);
    oembedUrl.searchParams.set('url', url);
    oembedUrl.searchParams.set('format', 'json');

    const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

    if (!response.ok) {
      throw new Error(`유튜브 oEmbed가 ${response.status} 상태를 반환했습니다.`);
    }

    const oembed = (await response.json()) as YoutubeOembedResponse;

    return {
      title: oembed.title ?? null,
      siteName: 'YouTube',
      faviconUrl: YOUTUBE_FAVICON_URL,
      imageUrl: oembed.thumbnail_url ?? null,
      authorName: oembed.author_name ?? null,
    };
  }
}
