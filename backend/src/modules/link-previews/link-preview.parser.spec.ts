import { parseLinkPreviewHtml } from './link-preview.parser';

describe('parseLinkPreviewHtml', () => {
  it('og:title을 title보다 우선하고 상대 favicon을 절대 URL로 변환한다', () => {
    const html = `
      <html>
        <head>
          <title>HTML Title</title>
          <meta content="BandCo &amp; JIRA" property="og:title" />
          <meta property="og:site_name" content="Jira" />
          <link href="/assets/favicon.ico" rel="shortcut icon" />
        </head>
      </html>
    `;

    expect(parseLinkPreviewHtml(html, new URL('https://bandco.atlassian.net/jira/project'))).toEqual({
      title: 'BandCo & JIRA',
      siteName: 'Jira',
      faviconUrl: 'https://bandco.atlassian.net/assets/favicon.ico',
    });
  });

  it('og:title이 없으면 title을 사용하고 없는 필드는 null로 반환한다', () => {
    const html = '<html><head><title>  BandCo   Docs  </title></head></html>';

    expect(parseLinkPreviewHtml(html, new URL('https://docs.example.com'))).toEqual({
      title: 'BandCo Docs',
      siteName: null,
      faviconUrl: null,
    });
  });
});
