import { useRef } from 'react';
import { useBandCreateForm } from '@/features/band-create/model/useBandCreateForm';
import { Button } from '@/shared/ui/button';
import {
  AppDialogBody,
  AppDialogClose,
  AppDialogContent,
  AppDialogFooter,
  AppDialogHeader,
  Dialog,
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
  } = useBandCreateForm(open, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <AppDialogContent>
        <AppDialogClose />

        <AppDialogHeader>
          <DialogTitle className="text-2xl text-grey-100">
            밴드 만들기
          </DialogTitle>
        </AppDialogHeader>

        <AppDialogBody>
          {/* 공개/비공개 토글 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <span className="typo-lg-sb">밴드 공개 여부</span>
              <div className="h-1 w-1 rounded-full bg-destructive"></div>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-white/24 border-b-white/24 bg-grey-500/24 p-2">
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
                        'w-20 rounded-l-full rounded-r-full px-5 py-4 text-center typo-sm-sb transition',
                        isActive
                          ? 'bg-primary text-secondary-surface'
                          : 'bg-transparent text-grey-100',
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
              className="border-grey-200/80 placeholder:text-grey-200 hover:border-grey-100 focus-visible:border-grey-100"
            />
          </label>

          {/* 커버 이미지 */}
          <div className="flex flex-col gap-3">
            <span className="typo-lg-sb">밴드 커버</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-grey-500/30 px-5 text-muted transition hover:border-ring',
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
                  <UploadIcon className="h-6 w-6 text-grey-300" />
                  <span className="typo-base-r text-grey-100">
                    파일을 선택하세요.
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
            <div className="flex items-center gap-3 rounded-l-full rounded-r-full border border-border bg-grey-500/30 px-5 text-grey-100">
              <Search className="text-grey-300" />
              <Input
                disabled
                placeholder="이름 또는 ID를 검색하세요"
                className="border-none bg-transparent px-0 placeholder:text-grey-100"
              />
            </div>
          </div>

          {fieldError ? (
            <p className="typo-sm-r text-destructive">{fieldError}</p>
          ) : null}
          {error ? <p className="typo-sm-r text-destructive">{error}</p> : null}
        </AppDialogBody>

        <AppDialogFooter>
          <Button
            type="button"
            variant={'shining'}
            size="lg"
            disabled={isSubmitDisabled || isLoading}
            isLoading={isLoading}
            onClick={() => void handleSubmit()}
            loadingContent="생성 중..."
            className={cn(
              'w-fit text-base',
              isSubmitDisabled
                ? 'border border-white bg-white/60'
                : 'text-grey-600',
            )}
          >
            만들기
          </Button>
        </AppDialogFooter>
      </AppDialogContent>
    </Dialog>
  );
};
