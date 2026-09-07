import { useState } from 'react';
import { toast } from 'sonner';
import { assertUploadableImage } from '@/shared/lib/crop-image';

/**
 * `<input type="file">` 와 `ImageCropDialog` 사이의 대기 상태를 들고 있는 훅.
 * 고른 파일을 바로 폼에 넣지 않고 크롭 모달로 넘긴 뒤, 모달이 돌려준 파일만 폼에 들어간다.
 *
 * ```tsx
 * const { selectFile, cropDialogProps } = useImageCrop();
 * <input type="file" onChange={(e) => { selectFile(e.target.files?.[0]); e.target.value = ''; }} />
 * <ImageCropDialog {...cropDialogProps} aspect={CROP_ASPECT.square} onCropped={setCoverFile} />
 * ```
 */
export const useImageCrop = () => {
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  /** 크롭 모달을 여는 진입점. 형식·용량은 여기서 걸러 모달까지 가지 않게 한다. */
  const selectFile = (file: File | null | undefined) => {
    if (!file) return;
    try {
      assertUploadableImage(file);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : '이미지를 불러오지 못했습니다.',
      );
      return;
    }
    setPendingFile(file);
  };

  const cropDialogProps = {
    open: pendingFile !== null,
    file: pendingFile,
    onOpenChange: (next: boolean) => {
      if (!next) setPendingFile(null);
    },
  };

  return { selectFile, cropDialogProps };
};
