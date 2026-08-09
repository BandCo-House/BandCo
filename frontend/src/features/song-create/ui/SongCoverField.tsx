import type { ChangeEvent } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button, buttonVariants } from '@/shared/ui/button';
import { FieldLabel } from '@/shared/ui/field';
import { ThumbnailRemoveButton } from '@/shared/ui/thumbnail-remove-button';
import type { SongCoverSource } from '../model/types';

interface SongCoverFieldProps {
  source: SongCoverSource;
  /** 검색으로 고른 곡의 앨범아트. '기본 이미지로'가 복원하는 대상이다. */
  albumImageUrl: string | null;
  /** 직접 올린 커버의 blob 미리보기 URL. */
  previewUrl: string | null;
  onSelectFile: (file: File) => void;
  onResetToAlbum: () => void;
  onClear: () => void;
}

const THUMBNAIL_CLASS = 'size-20 rounded-md object-cover';

/** 커버 조작 pill. 디자인상 테두리·글자 모두 primary(노랑, #ecfcab)다. */
const COVER_BUTTON_CLASS = 'border-primary text-primary';

/**
 * 합주곡 커버. 앨범아트(검색 원본) / 직접 올린 이미지 / 비움 세 상태를 오간다.
 * 앨범아트가 없는 곡(직접 입력)은 되돌릴 원본이 없어 '기본 이미지로'를 막는다.
 */
export const SongCoverField = ({
  source,
  albumImageUrl,
  previewUrl,
  onSelectFile,
  onResetToAlbum,
  onClear,
}: SongCoverFieldProps) => {
  const imageUrl = source === 'album' ? albumImageUrl : previewUrl;

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onSelectFile(file);
    // 같은 파일을 다시 골라도 change가 발생하도록 값을 비운다.
    event.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel size="lg">합주곡 커버</FieldLabel>

      <div className="relative w-20">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="선택한 커버 미리보기"
            className={THUMBNAIL_CLASS}
          />
        ) : (
          <div
            role="img"
            aria-label="커버 이미지 없음"
            className={cn(THUMBNAIL_CLASS, 'bg-grey-300')}
          />
        )}
        {imageUrl && (
          <ThumbnailRemoveButton label="커버 이미지 제거" onClick={onClear} />
        )}
      </div>

      <div className="flex justify-end gap-2">
        {source !== 'album' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!albumImageUrl}
            onClick={onResetToAlbum}
            className={cn(
              COVER_BUTTON_CLASS,
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            기본 이미지로
          </Button>
        )}
        <label
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            COVER_BUTTON_CLASS,
            'cursor-pointer focus-within:outline-2 focus-within:outline-primary',
          )}
        >
          이미지 수정
          <input
            type="file"
            accept="image/*"
            onChange={handleSelect}
            className="sr-only"
          />
        </label>
      </div>
    </div>
  );
};
