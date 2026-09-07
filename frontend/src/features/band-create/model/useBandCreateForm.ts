import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { uploadFile } from '@/shared/api/upload';
import { useImageCrop } from '@/shared/lib/use-image-crop';
import { bandCreateSchema } from './schema';
import { useBandCreate } from './useBandCreate';

const initialForm = {
  name: '',
  description: '',
  visibility: false,
  coverImage: null as File | null,
};

export const useBandCreateForm = (
  _open: boolean,
  onOpenChange: (open: boolean) => void,
) => {
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  const { selectFile, cropDialogProps } = useImageCrop();
  const {
    submit,
    isLoading: isSubmitLoading,
    reset: resetMutation,
  } = useBandCreate();

  const resetForm = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setForm(initialForm);
    setPreview(null);
    setIsUploading(false);
    resetMutation();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    selectFile(e.target.files?.[0]);
    // 같은 파일을 다시 골라도 change가 발생하도록 값을 비운다(크롭을 취소한 뒤 재시도).
    e.target.value = '';
  };

  /** 크롭 모달이 돌려준 파일만 폼에 들어간다. 원본은 여기까지 오지 않는다. */
  const applyCroppedCover = (file: File) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setForm((f) => ({ ...f, coverImage: file }));
    setPreview(url);
  };

  const clearCover = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setForm((f) => ({ ...f, coverImage: null }));
    setPreview(null);
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleSubmit = async () => {
    let uploadedCoverImgUrl: string | null = null;

    if (form.coverImage) {
      try {
        setIsUploading(true);
        uploadedCoverImgUrl = await uploadFile(form.coverImage, 'bands');
      } catch (err) {
        setIsUploading(false);
        toast.error(
          err instanceof Error
            ? err.message
            : '커버 이미지 업로드에 실패했습니다.',
        );
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const parsed = bandCreateSchema.safeParse({
      name: form.name,
      description: form.description.trim() || null,
      visibility: form.visibility,
      coverImgUrl: uploadedCoverImgUrl,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? '입력값을 확인해주세요');
      return;
    }
    const result = await submit(parsed.data);
    if (!result.success) {
      toast.error(result.message ?? '밴드 생성에 실패했습니다.');
      return;
    }
    handleOpenChange(false);
  };

  const setName = (name: string) => setForm((f) => ({ ...f, name }));
  const setVisibility = (visibility: boolean) =>
    setForm((f) => ({ ...f, visibility }));

  const isSubmitDisabled = form.name.trim().length === 0 || isUploading;
  const isLoading = isSubmitLoading || isUploading;

  return {
    form,
    preview,
    isLoading,
    isSubmitDisabled,
    handleOpenChange,
    handleCoverChange,
    applyCroppedCover,
    cropDialogProps,
    clearCover,
    handleSubmit,
    setName,
    setVisibility,
  };
};
