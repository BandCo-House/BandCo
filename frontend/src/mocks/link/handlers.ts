import { http, HttpResponse } from 'msw';
import type { ApiSuccessResponse } from '@/shared/api/types';
import type { LinkPreview } from '@/entities/link/model/types';
import { API_URL } from '../config';

// 서버가 og 파싱을 붙이기 전까지 쓰는 mock. 알려진 호스트는 사람이 읽는 제목으로,
// 나머지는 호스트명을 제목으로 돌려줘 폴백 경로도 함께 확인할 수 있다.
const KNOWN_TITLES: Record<string, string> = {
  'bandco.atlassian.net': 'BandCo JIRA',
  'www.youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'docs.google.com': 'Google Docs',
  'www.notion.so': 'Notion',
};

const YOUTUBE_HOSTNAMES = new Set([
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
]);

const toHostname = (raw: string): string => {
  try {
    return new URL(raw).hostname;
  } catch {
    return '';
  }
};

export const linkHandlers = [
  http.get(`${API_URL}/link-previews`, ({ request }) => {
    const url = new URL(request.url).searchParams.get('url') ?? '';
    const hostname = toHostname(url);

    if (!hostname) {
      return new HttpResponse(null, { status: 400 });
    }

    // 서버는 유튜브 링크만 oEmbed로 읽어 영상 썸네일·채널 이름을 채운다.
    const preview: LinkPreview = YOUTUBE_HOSTNAMES.has(hostname)
      ? {
          url,
          title: 'Bruno Mars - Count On Me (Official Video)',
          siteName: 'YouTube',
          faviconUrl: 'https://www.youtube.com/favicon.ico',
          imageUrl: 'https://i.ytimg.com/vi/LjhCEhWiKXk/hqdefault.jpg',
          authorName: 'Bruno Mars',
        }
      : {
          url,
          title: KNOWN_TITLES[hostname] ?? hostname,
          siteName: hostname,
          faviconUrl: `https://${hostname}/favicon.ico`,
          imageUrl: null,
          authorName: null,
        };

    // 실제 서버처럼 응답 봉투로 감싼다. 감싸지 않으면 apiGet이 data를 찾지 못해 파싱에 실패한다.
    return HttpResponse.json<ApiSuccessResponse<LinkPreview>>({
      status: 'success',
      error: null,
      message: '링크 미리보기 조회 성공',
      data: preview,
    });
  }),
];
