import { useEffect, useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { uploadFile } from '@/shared/api';
import { useCreatePlace } from '@/entities/place/api/useCreatePlace';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/shared/ui/sheet';
import { CROP_ASPECT, ImageCropDialog } from '@/shared/ui/image-crop-dialog';
import { useImageCrop } from '@/shared/lib/use-image-crop';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Field, FieldLabel } from '@/shared/ui/field';
import { ThumbnailRemoveButton } from '@/shared/ui/thumbnail-remove-button';

interface PlaceCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
  /** 생성 성공 시 새 장소 ID. 폼에서 방금 만든 장소를 바로 선택하는 데 쓴다. */
  onCreated?: (placeId: string) => void;
}

/**
 * 연습 장소 추가(풀스크린). 이름·주소(필수)와 커버 이미지(선택)를 입력한다.
 * 커버는 presigned 업로드로 objectUrl을 받아 imageUrl로 전송한다.
 */
export const PlaceCreateModal = ({
  open,
  onOpenChange,
  bandId,
  onCreated,
}: PlaceCreateModalProps) => {
  const { mutate, isPending } = useCreatePlace(bandId);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { selectFile, cropDialogProps } = useImageCrop();

  // 열릴 때 폼을 초기화한다(effect 대신 렌더 중 파생).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName('');
      setAddress('');
      setCoverFile(null);
      setCoverPreview(null);
      setIsUploading(false);
    }
  }

  // 미리보기 blob URL은 값이 바뀌거나 언마운트될 때 revoke한다.
  // (재오픈 초기화·재선택·취소 모두 여기서 한 번에 해제)
  useEffect(() => {
    if (!coverPreview) return;
    return () => URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  const clearCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
  };

  const handleCoverSelect = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
    // 같은 파일을 다시 골라도 change가 발생하도록 값을 비운다(크롭을 취소한 뒤 재시도).
    event.target.value = '';
  };

  /** 크롭 모달이 돌려준 파일만 폼에 들어간다. 원본은 여기까지 오지 않는다. */
  const applyCroppedCover = (file: File) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const canSubmit =
    name.trim().length > 0 &&
    address.trim().length > 0 &&
    !isPending &&
    !isUploading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    let imageUrl: string | undefined;
    if (coverFile) {
      setIsUploading(true);
      try {
        imageUrl = await uploadFile(coverFile, 'places');
      } catch {
        toast.error(
          '커버 이미지를 업로드하지 못했어요. 잠시 후 다시 시도해주세요.',
        );
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    mutate(
      { name: name.trim(), address: address.trim(), imageUrl },
      {
        onSuccess: (created) => {
          toast.success('연습 장소를 추가했어요.');
          onCreated?.(created.placeId);
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
              <label className="flex cursor-pointer items-center gap-3 rounded-full field-border border-surface-1 bg-grey-500/24 px-5 py-4 text-grey-300">
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
    </Sheet>
  );
};
