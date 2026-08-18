import type { LinkPreviewReader } from './link-preview-http.client';
import { LinkPreviewsService } from './link-previews.service';

const LINK_URL = 'https://bandco.atlassian.net/jira/project';

describe('LinkPreviewsService', () => {
  it('외부 페이지의 링크 미리보기 정보를 반환한다', async () => {
    const reader: LinkPreviewReader = {
      async readLinkPreview() {
        return {
          title: 'BandCo JIRA',
          siteName: 'Jira',
          faviconUrl: 'https://bandco.atlassian.net/favicon.ico',
        };
      },
    };
    const service = new LinkPreviewsService(reader);

    await expect(service.getLinkPreview(LINK_URL)).resolves.toEqual({
      url: LINK_URL,
      title: 'BandCo JIRA',
      siteName: 'Jira',
      faviconUrl: 'https://bandco.atlassian.net/favicon.ico',
    });
  });

  it('외부 페이지를 읽지 못하면 원본 URL과 null 메타데이터를 반환한다', async () => {
    const reader: LinkPreviewReader = {
      async readLinkPreview() {
        throw new Error('조회 실패');
      },
    };
    const service = new LinkPreviewsService(reader);

    await expect(service.getLinkPreview(LINK_URL)).resolves.toEqual({
      url: LINK_URL,
      title: null,
      siteName: null,
      faviconUrl: null,
    });
  });
});
