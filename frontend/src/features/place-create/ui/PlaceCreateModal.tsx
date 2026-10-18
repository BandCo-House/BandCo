import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { Sheet, SheetContent, SheetDescription } from '@/shared/ui/sheet';
import { PlaceFormView } from './PlaceFormView';

interface PlaceCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
  /** 생성 성공 시 새 장소 ID. 폼에서 방금 만든 장소를 바로 선택하는 데 쓴다. */
  onCreated?: (placeId: string) => void;
}

/** 연습 장소 추가(풀스크린). 폼 자체는 PlaceFormView가 맡는다. */
export const PlaceCreateModal = ({
  open,
  onOpenChange,
  bandId,
  onCreated,
}: PlaceCreateModalProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      showCloseButton={false}
      className="inset-0 mx-auto flex h-full w-full max-w-[648px] flex-col gap-0 border-0 bg-gradient-to-b from-gradient-top to-gradient-bottom p-0 sm:max-w-[648px]"
    >
      <SheetDescription className="sr-only">
        연습 장소의 이름·위치·커버를 입력해 추가합니다.
      </SheetDescription>

      <header className="flex items-center bg-gradient-top/65 py-3 pr-5 pl-2.5 header-glow backdrop-blur-sm">
        <button
          type="button"
          aria-label="뒤로 가기"
          onClick={() => onOpenChange(false)}
          className="inline-flex size-10 items-center justify-center rounded-full text-grey-50 focus-visible:outline-2 focus-visible:outline-key"
        >
          <ArrowRightIcon aria-hidden="true" className="size-6 rotate-180" />
        </button>
      </header>

      <PlaceFormView
        bandId={bandId}
        onCancel={() => onOpenChange(false)}
        onSaved={(placeId) => {
          onCreated?.(placeId);
          onOpenChange(false);
        },
        onError: () => {
          toast.error(
            '연습 장소를 추가하지 못했어요. 잠시 후 다시 시도해주세요.',
          );
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className="inset-0 mx-auto flex h-full w-full max-w-[648px] flex-col gap-0 border-0 bg-gradient-to-b from-gradient-top to-gradient-bottom p-0 sm:max-w-[648px]"
      >
        <SheetDescription className="sr-only">
          연습 장소의 이름·주소·커버를 입력해 추가합니다.
        </SheetDescription>

        <header className="flex items-center bg-gradient-top/65 py-3 pr-5 pl-2.5 header-glow backdrop-blur-sm">
          <button
            type="button"
            aria-label="뒤로 가기"
            onClick={() => onOpenChange(false)}
            className="inline-flex size-10 items-center justify-center rounded-full text-grey-50 focus-visible:outline-2 focus-visible:outline-key"
          >
            <ArrowRightIcon aria-hidden="true" className="size-6 rotate-180" />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-9 overflow-y-auto px-5 pt-8 pb-6">
          <div className="flex flex-col gap-2">
            <SheetTitle className="typo-xl-sb text-grey-50">
              장소 추가
            </SheetTitle>
            <p className="typo-base-r text-grey-300">
              연습이 진행될 장소를 추가해보세요
            </p>
          </div>

          <Field label="장소 이름" required labelSize="lg" htmlFor="place-name">
            <Input
              id="place-name"
              variant="underline"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="장소 이름을 입력해주세요"
              maxLength={120}
              aria-required
            />
          </Field>

          <Field label="주소" required labelSize="lg" htmlFor="place-address">
            <Input
              id="place-address"
              variant="underline"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="주소를 입력해주세요(상세주소 포함)"
              maxLength={255}
              aria-required
            />
          </Field>

          <div className="flex flex-col gap-2">
            <FieldLabel size="lg">장소 커버</FieldLabel>
            {coverPreview ? (
              <div className="relative size-20">
                <img
                  src={coverPreview}
                  alt="선택한 커버 미리보기"
                  className="size-full rounded-md border border-grey-50 object-cover opacity-80"
                />
                <ThumbnailRemoveButton label="커버 제거" onClick={clearCover} />
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-3 rounded-full bg-grey-500/24 glass-surface px-5 py-4 text-grey-300">
                <Upload aria-hidden="true" className="size-6" />
                <span className="typo-base-sb">파일을 선택하세요</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="sr-only"
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 bg-gradient-top/65 px-5 py-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] footer-glow backdrop-blur-sm">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="border-grey-200 text-grey-100"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="shining"
            size="lg"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            추가
          </Button>
        </div>
      </SheetContent>

      <ImageCropDialog
        {...cropDialogProps}
        aspect={CROP_ASPECT.square}
        title="장소 커버 자르기"
        onCropped={applyCroppedCover}
      />
    </SheetContent>
  </Sheet>
);
