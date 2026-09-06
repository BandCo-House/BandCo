import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { uploadFile } from '@/shared/api/upload';
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
    const file = e.target.files?.[0] ?? null;
    setForm((f) => ({ ...f, coverImage: file }));
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (file) {
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setPreview(url);
    } else {
      setPreview(null);
    }
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
    handleSubmit,
    setName,
    setVisibility,
  };
};
