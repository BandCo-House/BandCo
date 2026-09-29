import type { LinkPreviewMetadata } from './types/link-preview.type';
import type { LinkPreviewReader } from './link-preview-http.client';
import { LinkPreviewsService } from './link-previews.service';

const LINK_URL = 'https://bandco.atlassian.net/jira/project';
const YOUTUBE_URL = 'https://www.youtube.com/watch?v=LjhCEhWiKXk';

const htmlMetadata: LinkPreviewMetadata = {
  title: 'BandCo JIRA',
  siteName: 'Jira',
  faviconUrl: 'https://bandco.atlassian.net/favicon.ico',
  imageUrl: null,
  authorName: null,
};

const youtubeMetadata: LinkPreviewMetadata = {
  title: 'Bruno Mars - Just The Way You Are (Official Music Video)',
  siteName: 'YouTube',
  faviconUrl: 'https://www.youtube.com/favicon.ico',
  imageUrl: 'https://i.ytimg.com/vi/LjhCEhWiKXk/hqdefault.jpg',
  authorName: 'Bruno Mars',
};

/** 호출된 URL을 기록하고 정해진 메타데이터를 돌려주는 reader stub */
function createReaderStub(metadata: LinkPreviewMetadata, calledUrls: string[]): LinkPreviewReader {
  return {
    async readLinkPreview(url) {
      calledUrls.push(url);
      return metadata;
    },
  };
}

const failingReader: LinkPreviewReader = {
  async readLinkPreview() {
    throw new Error('조회 실패');
  },
};

describe('LinkPreviewsService', () => {
  it('외부 페이지의 링크 미리보기 정보를 반환한다', async () => {
    const htmlCalls: string[] = [];
    const youtubeCalls: string[] = [];
    const service = new LinkPreviewsService(createReaderStub(htmlMetadata, htmlCalls), createReaderStub(youtubeMetadata, youtubeCalls));

    await expect(service.getLinkPreview(LINK_URL)).resolves.toEqual({ url: LINK_URL, ...htmlMetadata });
    expect(htmlCalls).toEqual([LINK_URL]);
    expect(youtubeCalls).toEqual([]);
  });

  it('유튜브 링크는 HTML이 아니라 유튜브 reader로 읽어 썸네일과 채널 이름을 반환한다', async () => {
    const htmlCalls: string[] = [];
    const youtubeCalls: string[] = [];
    const service = new LinkPreviewsService(createReaderStub(htmlMetadata, htmlCalls), createReaderStub(youtubeMetadata, youtubeCalls));

    await expect(service.getLinkPreview(YOUTUBE_URL)).resolves.toEqual({ url: YOUTUBE_URL, ...youtubeMetadata });
    expect(youtubeCalls).toEqual([YOUTUBE_URL]);
    expect(htmlCalls).toEqual([]);
  });

  it('외부 페이지를 읽지 못하면 원본 URL과 null 메타데이터를 반환한다', async () => {
    const service = new LinkPreviewsService(failingReader, failingReader);

    await expect(service.getLinkPreview(YOUTUBE_URL)).resolves.toEqual({
      url: YOUTUBE_URL,
      title: null,
      siteName: null,
      faviconUrl: null,
      imageUrl: null,
      authorName: null,
    });
  });
});
