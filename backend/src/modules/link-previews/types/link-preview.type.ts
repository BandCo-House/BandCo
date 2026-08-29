export interface LinkPreviewMetadata {
  title: string | null;
  siteName: string | null;
  faviconUrl: string | null;
}

export interface LinkPreview extends LinkPreviewMetadata {
  url: string;
}
