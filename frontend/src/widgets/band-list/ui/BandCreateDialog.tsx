import { useRef } from 'react';
import { useBandCreateForm } from '@/features/band-create/model/useBandCreateForm';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/utils';
import { Search, UploadIcon } from 'lucide-react';

type BandCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const BandCreateDialog = ({
  open,
  onOpenChange,
}: BandCreateDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
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
  } = useBandCreateForm(onOpenChange);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border border-white/20 bg-inherit/10 shadow-[0_0_20px_2px_rgba(255,255,255,0.4)] backdrop-blur-sm">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl text-white">밴드 만들기</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-9 text-white">
          {/* 공개/비공개 토글 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <span className="typo-lg-sb">밴드 공개 여부</span>
              <div className="h-1 w-1 rounded-full bg-destructive"></div>
            </div>
            <div className="w-fit rounded-l-full rounded-r-full border border-grey-100 p-2">
              <div className="flex gap-2">
                {(['비공개', '공개'] as const).map((label) => {
                  const value = label === '공개';
                  const isActive = form.visibility === value;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setVisibility(value)}
                      className={cn(
                        'w-[78px] rounded-xl border px-4 py-2 text-center typo-sm-sb transition',
                        isActive
                          ? 'text-secondary-surface'
                          : 'border-border bg-transparent text-grey-100',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 밴드 이름 */}
          <label htmlFor="band-name" className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <span className="typo-lg-sb">밴드 이름</span>
              <div className="h-1 w-1 rounded-full bg-destructive"></div>
            </div>
            <Input
              id="band-name"
              variant="underline"
              value={form.name}
              onChange={(e) => setName(e.target.value)}
              placeholder="밴드 이름을 입력하세요"
              className={`${form.name.length > 0 ? 'border-key' : ''}`}
            />
          </label>

          {/* 커버 이미지 */}
          <div className="flex flex-col gap-3">
            <span className="typo-lg-sb">밴드 커버</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative flex items-center overflow-hidden rounded-2xl border border-border bg-input px-5 text-muted transition hover:border-ring',
                preview
                  ? 'h-48 w-48 rounded-full'
                  : 'h-14 w-full rounded-l-full rounded-r-full',
              )}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="커버 미리보기"
                  className="h-full w-full object-fill"
                />
              ) : (
                <>
                  <UploadIcon className="mr-1 h-6 w-6 text-grey-500" />
                  <span className="typo-base-r text-grey-100">
                    파일을 선택하거나 드래그 하세요.
                  </span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>

          {/* 멤버 초대 (UI only) */}
          <div className="flex flex-col gap-3">
            <span className="typo-lg-sb">멤버 초대</span>
            <div className="flex items-center rounded-l-full rounded-r-full border border-border bg-input px-5 text-grey-100">
              <Search className="text-grey-500" />
              <Input
                disabled
                placeholder="이름 또는 ID를 검색하세요"
                className="border-none bg-none placeholder:text-grey-100"
              />
            </div>
          </div>

          {fieldError ? (
            <p className="typo-sm-r text-destructive">{fieldError}</p>
          ) : null}
          {error ? <p className="typo-sm-r text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={isSubmitDisabled}
            isLoading={isLoading}
            onClick={() => void handleSubmit()}
            loadingContent="생성 중..."
            className={cn(
              'text-lg-b rounded-l-full rounded-r-full border border-grey-100 bg-inherit px-7 py-5',
              isSubmitDisabled ? 'text-grey-200' : 'text-secondary-surface',
            )}
          >
            만들기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
