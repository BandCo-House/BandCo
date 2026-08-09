import { AttachmentItem } from '@/shared/ui/attachment-item';
import { useLinkPreview } from '../api/useLinkPreview';

/** 미리보기를 못 받았을 때 쓰는 제목. */
const toHostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

interface LinkAttachmentItemProps {
  url: string;
  onRemove?: () => void;
}

/** 외부 링크 첨부 한 줄. 제목·파비콘은 서버 미리보기로 채우고 없으면 호스트명으로 대체한다. */
export const LinkAttachmentItem = ({
  url,
  onRemove,
}: LinkAttachmentItemProps) => {
  const { data } = useLinkPreview(url);

  return (
    <AttachmentItem
      name={data?.title || toHostname(url)}
      href={url}
      iconUrl={data?.faviconUrl}
      onRemove={onRemove}
    />
  );
};
