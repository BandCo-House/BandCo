import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

interface UseAudioPreviewOptions {
  /** 재생 실패 시 토스트 문구. */
  errorMessage?: string;
}

/**
 * 곡 미리듣기(preview) 오디오 재생을 관리하는 공용 훅.
 * `audioRef`를 `<audio>`에 연결하고 `audioEventProps`를 spread한 뒤 버튼에서 `toggle`을 호출한다.
 * 프로필 음악·라이브러리 합주곡 등 미리듣기가 필요한 곳에서 공용으로 쓴다.
 */
export const useAudioPreview = (
  src: string | null | undefined,
  { errorMessage = '곡을 재생할 수 없어요.' }: UseAudioPreviewOptions = {},
) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasShownErrorRef = useRef(false);
  const canPlay = Boolean(src);

  const showError = useCallback(() => {
    if (hasShownErrorRef.current) return;
    hasShownErrorRef.current = true;
    toast.error(errorMessage);
  }, [errorMessage]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!canPlay || !audio) return;

    if (isPlaying) {
      audio.pause();
      return;
    }

    void audio.play().catch(() => {
      setIsPlaying(false);
      showError();
    });
  }, [canPlay, isPlaying, showError]);

  const audioEventProps = {
    onPlay: () => setIsPlaying(true),
    onPause: () => {
      setIsPlaying(false);
      hasShownErrorRef.current = false;
    },
    onEnded: () => setIsPlaying(false),
    onError: () => {
      setIsPlaying(false);
      showError();
    },
  };

  return { isPlaying, canPlay, toggle, audioRef, audioEventProps };
};
