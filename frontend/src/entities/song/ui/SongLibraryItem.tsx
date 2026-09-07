import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useAudioPreview } from '@/shared/lib/use-audio-preview';
import { useTrackPreview } from '../api/useTrackPreview';
import type { SongListItem } from '../model/types';

interface SongLibraryItemProps {
  song: SongListItem;
}

const DISC_BASE_CLASS =
  'relative flex size-[100px] items-center justify-center overflow-hidden rounded-full';

/**
 * 라이브러리 합주곡 한 항목. 원형 커버 + 곡명/아티스트.
 * 커버 이미지가 없으면 밝은 회색 원으로 비어 있음을 드러낸다.
 *
 * 미리듣기 URL은 곡 목록 응답에 없어서, 재생을 누른 곡만 externalTrackId로
 * 트랙을 조회해 재생한다(목록 진입만으로 곡 수만큼 요청하지 않도록).
 */
export const SongLibraryItem = ({ song }: SongLibraryItemProps) => {
  const [hasRequested, setHasRequested] = useState(false);
  // 재생을 눌러 둔 상태. 렌더에 영향이 없어 state 대신 ref로 둔다.
  const playWhenReadyRef = useRef(false);

  const {
    data: track,
    isFetching,
    isError,
    refetch,
  } = useTrackPreview(song.externalTrackId, hasRequested);
  const previewUrl = track?.previewUrl ?? null;

  // 조회가 끝났는데 미리듣기가 없으면 눌러도 아무 일이 없어 보이므로 이유를 알린다.
  useEffect(() => {
    if (!hasRequested || isFetching) return;
    if (isError) {
      toast.error('곡을 재생할 수 없어요.');
      return;
    }
    if (track && !track.previewUrl) {
      toast.info('이 곡은 미리듣기를 제공하지 않아요.');
    }
  }, [hasRequested, isFetching, isError, track]);

  const { isPlaying, toggle, audioRef, audioEventProps } = useAudioPreview(
    previewUrl,
    { errorMessage: '곡을 재생할 수 없어요.' },
  );

  // 미리듣기 URL이 도착하면 눌러 둔 재생을 이어서 실행한다.
  useEffect(() => {
    if (!playWhenReadyRef.current || !previewUrl) return;
    playWhenReadyRef.current = false;

    const audio = audioRef.current;
    if (!audio) return;
    try {
      // 브라우저가 재생을 막으면 사용자가 다시 누르면 되므로 조용히 넘어간다.
      void audio.play()?.catch(() => undefined);
    } catch {
      // jsdom처럼 재생을 지원하지 않는 환경에서는 동기적으로 throw한다.
    }
  }, [previewUrl, audioRef]);

  const canPlay = Boolean(song.externalTrackId);

  const handleToggle = () => {
    if (previewUrl) {
      toggle();
      return;
    }
    playWhenReadyRef.current = true;
    // 이미 조회했다가 실패한 경우엔 상태만 다시 세워도 재요청이 일어나지 않는다.
    if (hasRequested) {
      void refetch();
      return;
    }
    setHasRequested(true);
  };

  const discClass = `${DISC_BASE_CLASS} ${song.songCoverUrl ? 'bg-grey-500' : 'bg-grey-200'}`;

  const cover = (
    <>
      {song.songCoverUrl && (
        <>
          <img
            src={song.songCoverUrl}
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
          onClick={handleToggle}
          aria-label={
            isPlaying ? `${song.title} 일시정지` : `${song.title} 미리듣기`
          }
          className={`${discClass} outline-none focus-visible:outline-2 focus-visible:outline-key`}
        >
          {cover}
        </button>
      ) : (
        <div className={discClass}>{cover}</div>
      )}
      {previewUrl && (
        <audio
          ref={audioRef}
          src={previewUrl}
          preload="none"
          {...audioEventProps}
        />
      )}
      <div className="flex w-full flex-col items-center gap-1 text-center">
        <p className="w-full truncate typo-sm-sb text-grey-100">{song.title}</p>
        <p className="w-full truncate typo-sm-sb text-grey-100">
          {song.artistName}
        </p>
      </div>
    </div>
  );
};
