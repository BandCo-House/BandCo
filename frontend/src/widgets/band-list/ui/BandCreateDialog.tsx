import { useState } from 'react';
import { bandCreateSchema } from '@/features/band-create/model/schema';
import { useBandCreate } from '@/features/band-create/model/useBandCreate';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';

type BandCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const initialForm = {
  name: '',
  description: '',
  visibility: true,
};

export const BandCreateDialog = ({
  open,
  onOpenChange,
}: BandCreateDialogProps) => {
  const [form, setForm] = useState(initialForm);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const { submit, isLoading, error } = useBandCreate();

  const resetForm = () => {
    setForm(initialForm);
    setFieldError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 밴드 만들기</DialogTitle>
          <DialogDescription>밴드 이름을 입력하세요</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <label htmlFor="band-name" className="flex flex-col gap-3">
            <span className="text-lg font-semibold">밴드 이름</span>
            <Input
              id="band-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="예: 신촌 락밴드"
            />
          </label>

          <label htmlFor="band-description" className="flex flex-col gap-3">
            <span className="text-lg font-semibold">밴드 소개</span>
            <textarea
              id="band-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="주 1회 합주하는 밴드입니다."
              className="w-full rounded-xl border border-border bg-white p-4 outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </label>

          <label className="flex items-center gap-3 text-muted">
            <Checkbox
              checked={form.visibility}
              onCheckedChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  visibility: checked === true,
                }))
              }
            />
            공개 밴드로 생성하기
          </label>

          {fieldError ? (
            <p className="text-sm text-destructive">{fieldError}</p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            취소
          </Button>
          <Button
            type="button"
            isLoading={isLoading}
            onClick={() => void handleSubmit()}
            loadingContent="생성 중..."
          >
            밴드 만들기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
