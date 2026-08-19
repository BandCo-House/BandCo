import { http, HttpResponse } from 'msw';
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

    return HttpResponse.json({
      url,
      title: KNOWN_TITLES[hostname] ?? hostname,
      siteName: hostname,
      faviconUrl: `https://${hostname}/favicon.ico`,
    });
  }),
];
