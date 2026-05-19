import { useState } from 'react';
import { bandCreateSchema } from './schema';
import { useBandCreate } from './useBandCreate';

const initialForm = {
  name: '',
  description: '',
  visibility: false,
  coverImage: null as File | null,
};

export const useBandCreateForm = (
  onOpenChange: (open: boolean) => void,
) => {
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const { submit, isLoading, error } = useBandCreate();

  const resetForm = () => {
    setForm(initialForm);
    setPreview(null);
    setFieldError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm((f) => ({ ...f, coverImage: file }));
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    const parsed = bandCreateSchema.safeParse({
      name: form.name,
      description: form.description.trim() || null,
      visibility: form.visibility,
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? '입력값을 확인해주세요');
      return;
    }
    setFieldError(null);
    await submit(parsed.data);
    handleOpenChange(false);
  };

  const setName = (name: string) => setForm((f) => ({ ...f, name }));
  const setVisibility = (visibility: boolean) =>
    setForm((f) => ({ ...f, visibility }));

  const isSubmitDisabled = form.name.trim().length === 0;

  return {
    form,
    preview,
    fieldError,
    isLoading,
    error,
    isSubmitDisabled,
    handleOpenChange,
    handleCoverChange,
    handleSubmit,
    setName,
    setVisibility,
  };
};
