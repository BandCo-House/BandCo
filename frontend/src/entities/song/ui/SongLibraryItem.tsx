import { Pause, Play } from 'lucide-react';
import { useAudioPreview } from '@/shared/lib/use-audio-preview';
import type { SongListItem } from '../model/types';

interface SongLibraryItemProps {
  song: SongListItem;
}

const DISC_CLASS =
  'relative flex size-[100px] items-center justify-center overflow-hidden rounded-full bg-grey-500';

/**
 * 라이브러리 합주곡 한 항목. 원형 커버(앨범아트) + 곡명/아티스트.
 * 미리듣기 URL이 있으면 디스크가 재생/일시정지 버튼이 되고, 없으면 표시 전용이다.
 */
export const SongLibraryItem = ({ song }: SongLibraryItemProps) => {
  const { isPlaying, canPlay, toggle, audioRef, audioEventProps } =
    useAudioPreview(song.previewUrl, {
      errorMessage: '곡을 재생할 수 없어요.',
    });

  const cover = (
    <>
      {song.albumImageUrl && (
        <>
          <img
            src={song.albumImageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 size-full object-cover"
          />
          <span aria-hidden="true" className="absolute inset-0 bg-black/20" />
        </>
      )}
      <span className="relative flex items-center rounded-full bg-gradient-to-b from-gradient-top to-gradient-bottom p-2.5">
        {isPlaying ? (
          <Pause
            aria-hidden="true"
            className="size-4 fill-grey-50 text-grey-50"
          />
        ) : (
          <Play
            aria-hidden="true"
            className="size-4 fill-grey-50 text-grey-50"
          />
        )}
      </span>
    </>
  );

  return (
    <div className="flex w-[100px] shrink-0 flex-col items-center gap-3">
      {canPlay ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={
            isPlaying ? `${song.title} 일시정지` : `${song.title} 미리듣기`
          }
          className={`${DISC_CLASS} outline-none focus-visible:outline-2 focus-visible:outline-key`}
        >
          {cover}
        </button>
      ) : (
        <div className={DISC_CLASS}>{cover}</div>
      )}
      {song.previewUrl && (
        <audio
          ref={audioRef}
          src={song.previewUrl}
          preload="none"
          {...audioEventProps}
        />
      )}
      <div className="flex w-full flex-col items-center gap-1 text-center">
        <p className="w-full truncate typo-sm-m text-grey-100">{song.title}</p>
        <p className="w-full truncate typo-sm-m text-grey-100">
          {song.artistName}
        </p>
      </div>
    </div>
  );
};
