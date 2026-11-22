import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Clock,
  Download,
  ExternalLink,
  Music,
  Pause,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAudioPreview } from '@/shared/lib/use-audio-preview';
import { formatSongLength } from '../lib/song-length';
import { getSongKeyLabel } from '../model/song-key';
import { useTrackPreview } from '../api/useTrackPreview';
import type { SongListItem } from '../model/types';

interface SongDetailViewProps {
  song: SongListItem;
}

const DISC_CLASS =
  'relative flex size-[100px] shrink-0 items-center justify-center overflow-hidden rounded-full shadow-lg';

export const SongDetailView = ({ song }: SongDetailViewProps) => {
  const [hasRequested, setHasRequested] = useState(false);
  const playWhenReadyRef = useRef(false);

  const {
    data: track,
    isFetching,
    isError,
    refetch,
  } = useTrackPreview(song.externalTrackId, hasRequested);
  const previewUrl = track?.previewUrl ?? null;

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

  useEffect(() => {
    if (!playWhenReadyRef.current || !previewUrl) return;
    playWhenReadyRef.current = false;

    const audio = audioRef.current;
    if (!audio) return;
    try {
      void audio.play()?.catch(() => undefined);
    } catch {
      // jsdom 등 미지원 환경 대비
    }
  }, [previewUrl, audioRef]);

  const canPlay = Boolean(song.externalTrackId);

  const handleToggle = () => {
    if (previewUrl) {
      toggle();
      return;
    }
    playWhenReadyRef.current = true;
    if (hasRequested) {
      void refetch();
      return;
    }
    setHasRequested(true);
  };

  const keyLabel = getSongKeyLabel(song.key);
  const lengthLabel = formatSongLength(song.songLength);
  const bpmLabel = song.bpm ? `${song.bpm} BPM` : null;

  return (
    <div className="flex flex-col gap-6">
      {/* 곡 기본 정보 */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <div
          className={`${DISC_CLASS} ${song.songCoverUrl ? 'bg-grey-500' : 'bg-grey-200'}`}
        >
          {song.songCoverUrl && (
            <>
              <img
                src={song.songCoverUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 size-full object-cover"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-black/25"
              />
            </>
          )}
          {canPlay ? (
            <button
              type="button"
              onClick={handleToggle}
              aria-label={
                isPlaying ? `${song.title} 일시정지` : `${song.title} 미리듣기`
              }
              className="relative z-10 flex size-9 items-center justify-center rounded-full bg-gradient-to-b from-gradient-top to-gradient-bottom text-grey-50 shadow-md transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-key"
            >
              {isPlaying ? (
                <Pause aria-hidden="true" className="size-4 fill-grey-50" />
              ) : (
                <Play
                  aria-hidden="true"
                  className="size-4 fill-grey-50 translate-x-0.5"
                />
              )}
            </button>
          ) : (
            <span className="relative z-10 flex size-9 items-center justify-center rounded-full bg-gradient-to-b from-gradient-top to-gradient-bottom text-grey-50 opacity-40">
              <Play
                aria-hidden="true"
                className="size-4 fill-grey-50 translate-x-0.5"
              />
            </span>
          )}
        </div>

        {previewUrl && (
          <audio
            ref={audioRef}
            src={previewUrl}
            preload="none"
            {...audioEventProps}
          />
        )}

        <div className="flex flex-col items-center gap-1 text-center">
          <h2 className="typo-lg-sb text-grey-50">{song.title}</h2>
          <p className="typo-sm-m text-grey-200">{song.artistName || '아티스트 미정'}</p>
        </div>

        {/* 메타 정보 3종 (조성, 재생시간, BPM) */}
        {(keyLabel || lengthLabel || bpmLabel) && (
          <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
            {keyLabel && (
              <div className="flex items-center gap-1 typo-xs-b text-grey-200">
                <Music aria-hidden="true" className="size-3.5" />
                <span>{keyLabel}</span>
              </div>
            )}
            {lengthLabel && (
              <div className="flex items-center gap-1 typo-xs-b text-grey-200">
                <Clock aria-hidden="true" className="size-3.5" />
                <span>{lengthLabel}</span>
              </div>
            )}
            {bpmLabel && (
              <div className="flex items-center gap-1 typo-xs-b text-grey-200">
                <Activity aria-hidden="true" className="size-3.5" />
                <span>{bpmLabel}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 참고 자료 섹션 */}
      <section className="flex flex-col gap-3">
        <h3 className="typo-lg-b text-grey-50">참고 자료</h3>
        {song.referenceFiles && song.referenceFiles.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {song.referenceFiles.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between rounded-full bg-grey-500/24 glass-surface py-2.5 pr-3 pl-6"
              >
                <span className="truncate typo-sm-m text-grey-50 mr-2 min-w-0 flex-1">
                  {file.fileName}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={file.fileUrl}
                    download={file.fileName}
                    aria-label={`${file.fileName} 다운로드`}
                    className="flex size-8 items-center justify-center rounded-full text-grey-200 transition-colors hover:text-grey-50 focus-visible:outline-2 focus-visible:outline-key"
                  >
                    <Download aria-hidden="true" className="size-4" />
                  </a>
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${file.fileName} 새 탭에서 열기`}
                    className="flex size-8 items-center justify-center rounded-full text-grey-200 transition-colors hover:text-grey-50 focus-visible:outline-2 focus-visible:outline-key"
                  >
                    <ExternalLink aria-hidden="true" className="size-4" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="typo-sm-r text-grey-400">등록된 참고 자료가 없어요.</p>
        )}
      </section>

      <hr className="border-t border-grey-500/40" />

      {/* 외부 링크 섹션 */}
      <section className="flex flex-col gap-3">
        <h3 className="typo-lg-b text-grey-50">외부 링크</h3>
        {song.externalLinks && song.externalLinks.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {song.externalLinks.map((link, idx) => (
              <li key={`${link}-${idx}`}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all typo-xs-sb text-grey-200 underline transition-colors hover:text-grey-50"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="typo-sm-r text-grey-400">등록된 외부 링크가 없어요.</p>
        )}
      </section>
    </div>
  );
};
