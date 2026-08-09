/**
 * 외부 링크 미리보기.
 * 브라우저는 CORS 때문에 남의 사이트 HTML을 직접 못 읽으므로, 서버가 대신 받아
 * og 메타를 파싱해 돌려준다(GET /link-previews?url=).
 */
export interface LinkPreview {
  url: string;
  /** og:title → <title> 순. 못 읽으면 null(호출부에서 호스트명으로 대체). */
  title: string | null;
  /** og:site_name. */
  siteName: string | null;
  /** 절대 URL 파비콘(og:image가 아니라 사이트 아이콘). */
  faviconUrl: string | null;
}
