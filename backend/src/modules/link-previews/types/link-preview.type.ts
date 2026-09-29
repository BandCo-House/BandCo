export interface LinkPreviewMetadata {
  title: string | null;
  siteName: string | null;
  faviconUrl: string | null;
  /** 대표 이미지. 유튜브 링크의 영상 썸네일만 채운다. */
  imageUrl: string | null;
  /** 작성자. 유튜브 링크의 채널 이름만 채운다. */
  authorName: string | null;
}

export interface LinkPreview extends LinkPreviewMetadata {
  url: string;
}
