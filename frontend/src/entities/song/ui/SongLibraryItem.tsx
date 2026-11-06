import type { SongListItem } from '../model/types';

interface SongLibraryItemProps {
  song: SongListItem;
  onClick?: () => void;
}

const DISC_BASE_CLASS =
  'relative flex size-[100px] items-center justify-center overflow-hidden rounded-full transition-transform group-hover:scale-105 group-active:scale-95 shadow-md';

/**
 * 라이브러리 합주곡 한 항목. 원형 커버 + 곡명/아티스트.
 * 커버 이미지가 없으면 밝은 회색 원으로 비어 있음을 드러낸다.
 * 클릭 시 상세 모달을 띄우는 액션을 지원한다.
 */
export const SongLibraryItem = ({ song, onClick }: SongLibraryItemProps) => {
  const discClass = `${DISC_BASE_CLASS} ${song.songCoverUrl ? 'bg-grey-500' : 'bg-grey-200'}`;

  const content = (
    <>
      <div className={discClass}>
        {song.songCoverUrl && (
          <img
            src={song.songCoverUrl}
            alt=""
            aria-hidden="true"
            className="size-full object-cover"
          />
        )}
      </div>
      <div className="flex w-full flex-col items-center gap-1 text-center">
        <p className="w-full truncate typo-sm-sb text-grey-100 group-hover:text-grey-50">
          {song.title}
        </p>
        <p className="w-full truncate typo-sm-sb text-grey-200">
          {song.artistName}
        </p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${song.title} 상세 보기`}
        className="group flex w-[100px] shrink-0 flex-col items-center gap-3 rounded-xl p-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-key"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex w-[100px] shrink-0 flex-col items-center gap-3 p-1">
      {content}
    </div>
  );
};
