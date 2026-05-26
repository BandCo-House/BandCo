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
  } = useBandCreateForm(open, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="overflow-hidden border border-white/20 bg-white/24"
        style={{ boxShadow: '0px 3px 6px 2px rgba(255,255,255,0.16)' }}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl text-grey-100">
            밴드 만들기
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-9 text-grey-100">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 353 678"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="pointer-events-none absolute inset-0 z-0"
            preserveAspectRatio="none"
          >
            <g filter="url(#filter0_f_1584_19953)">
              <path
                d="M354.222 684.439C141.51 721.444 -54.6672 585.939 -147.429 541.939C-240.19 497.939 -433.917 1162.65 -127.171 1226.5C179.575 1290.35 904.543 908.945 926.82 537.628C989.673 -510.001 214.544 94.999 345.197 392.771C393.139 502.038 445.738 668.518 354.222 684.439Z"
                fill="url(#paint0_linear_1584_19953)"
              />
            </g>
            <defs>
              <filter
                id="filter0_f_1584_19953"
                x="-438.551"
                y="-198.039"
                width={1514}
                height="1576.58"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity={0} result="BackgroundImageFix" />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="BackgroundImageFix"
                  result="shape"
                />
                <feGaussianBlur
                  stdDeviation="72.5"
                  result="effect1_foregroundBlur_1584_19953"
                />
              </filter>
              <linearGradient
                id="paint0_linear_1584_19953"
                x1="3.40972"
                y1={742}
                x2="663.109"
                y2="232.642"
                gradientUnits="userSpaceOnUse"
              >
                <stop
                  offset="0.0511104"
                  stopColor="#E1FC73"
                  stopOpacity="0.2"
                />
                <stop offset="0.853476" stopColor="#E1FC73" />
              </linearGradient>
            </defs>
          </svg>
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
                        'w-20 rounded-l-full rounded-r-full px-5 py-4 text-center typo-sm-sb transition',
                        isActive
                          ? 'bg-primary text-secondary-surface'
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
                  <UploadIcon className="mr-1 h-6 w-6 text-grey-300" />
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
            <div className="flex items-center rounded-l-full rounded-r-full border border-border bg-input px-5 text-grey-100">
              <Search className="text-grey-300" />
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
            variant={'shining'}
            disabled={isSubmitDisabled || isLoading}
            isLoading={isLoading}
            onClick={() => void handleSubmit()}
            loadingContent="생성 중..."
            className={cn(
              'text-base',
              isSubmitDisabled
                ? 'border border-white bg-white/60'
                : 'text-grey-600',
            )}
          >
            만들기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
