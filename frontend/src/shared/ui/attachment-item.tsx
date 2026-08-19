import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { fieldSurfaceClass } from './field';
import { Logo } from './logo';

interface AttachmentItemProps {
  /** 첨부 이름. 파일이면 파일명, 링크면 링크 제목. */
  name: string;
  /** 링크 주소. 주면 주소를 두 번째 줄에 보여주고 행 전체를 새 탭 링크로 만든다. */
  href?: string;
  /** 파일 썸네일 / 사이트 파비콘 이미지 URL. 없으면 링크 아이콘으로 대체한다. */
  iconUrl?: string | null;
  /** 지정 시 우측에 X(제거) 버튼을 렌더한다. */
  onRemove?: () => void;
  className?: string;
}

const rowClass = cn(fieldSurfaceClass, 'flex w-full items-center gap-2.5');

/** 파일/파비콘 썸네일. 이미지가 없으면 서비스 로고로 대체한다. */
const AttachmentThumbnail = ({
  iconUrl,
}: Pick<AttachmentItemProps, 'iconUrl'>) => (
  <span className="flex size-[33px] shrink-0 items-center justify-center overflow-clip rounded-lg bg-surface-1">
    {iconUrl ? (
      <img
        src={iconUrl}
        alt=""
        aria-hidden="true"
        className="size-full object-cover"
      />
    ) : (
      <Logo decorative className="h-auto w-[23px]" />
    )}
  </span>
);

/**
 * 첨부된 파일·외부 링크 한 줄. `href`가 있으면 제목 + 주소 2줄 링크로,
 * 없으면 파일명 1줄로 렌더링한다. 이름/주소는 모바일 폭에서 잘라 표시한다.
 *
 * 제거 버튼은 링크 행 위에 겹치지 않게 형제로 두고 행에 우측 여백을 준다
 * (<a> 안에 <button>을 넣으면 HTML 규격 위반이라 중첩하지 않는다).
 */
export const AttachmentItem = ({
  name,
  href,
  iconUrl,
  onRemove,
  className,
}: AttachmentItemProps) => {
  const thumbnail = <AttachmentThumbnail iconUrl={iconUrl} />;
  const removePadding = onRemove ? 'pr-14' : undefined;

  const row = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        rowClass,
        'outline-1 outline-transparent outline-solid hover:outline-primary focus-visible:outline-2 focus-visible:outline-primary',
        removePadding,
        !onRemove && className,
      )}
    >
      {thumbnail}
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="truncate typo-sm-sb text-primary">{name}</span>
        <span className="truncate typo-xs-sb text-grey-200">{href}</span>
      </span>
    </a>
  ) : (
    <div className={cn(rowClass, removePadding, !onRemove && className)}>
      {thumbnail}
      <span className="min-w-0 flex-1 truncate typo-sm-sb text-primary">
        {name}
      </span>
    </div>
  );

  if (!onRemove) return row;

  return (
    <div className={cn('relative', className)}>
      {row}
      <button
        type="button"
        aria-label={`${name} 첨부 삭제`}
        onClick={onRemove}
        className="absolute top-1/2 right-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-grey-300 hover:text-grey-50 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
};
