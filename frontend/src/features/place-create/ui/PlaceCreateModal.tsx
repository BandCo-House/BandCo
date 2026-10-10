import { useEffect, useState, type ChangeEvent } from 'react';
import { MapPin, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { uploadFile } from '@/shared/api';
import type { PlaceSearchResult } from '@/entities/place/api/place-search-api';
import { useCreatePlace } from '@/entities/place/api/useCreatePlace';
import { useUpdatePlace } from '@/entities/place/api/useUpdatePlace';
import type { Place } from '@/entities/place/model/types';
import { isKakaoMapsAvailable } from '@/shared/lib/kakao-maps';
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
import { PlaceSearchModal } from './PlaceSearchModal';

interface PlaceCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
  /** 생성 성공 시 새 장소 ID. 폼에서 방금 만든 장소를 바로 선택하는 데 쓴다. */
  onCreated?: (placeId: string) => void;
  /** 주면 추가 대신 이 장소를 수정한다. 값이 폼에 미리 채워진다. */
  place?: Place;
}

/**
 * 폼이 들고 있는 위치. 지도 검색으로 고르면 상호명·좌표가 있고,
 * 예전에 손으로 적은 주소를 수정하러 들어오면 주소만 있다.
 */
interface PlaceLocation {
  name?: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

const toLocation = (place: Place | undefined): PlaceLocation | null =>
  place?.address
    ? {
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
      }
    : null;

/**
 * 연습 장소 추가·수정(풀스크린). 이름만 필수고 위치·상세 위치·커버는 선택이다.
 * "동방 1호"처럼 이름만으로 통하는 장소가 많아 주소를 강제하지 않는다.
 * 위치는 직접 타이핑하지 않고 지도 검색으로 골라, 주소와 좌표가 함께 들어온다.
 * 커버는 presigned 업로드로 objectUrl을 받아 imageUrl로 전송한다.
 */
export const PlaceCreateModal = ({
  open,
  onOpenChange,
  bandId,
  onCreated,
  place,
}: PlaceCreateModalProps) => {
  const isEdit = place !== undefined;
  const { mutate: create, isPending: isCreating } = useCreatePlace(bandId);
  const { mutate: update, isPending: isUpdating } = useUpdatePlace();
  const isPending = isCreating || isUpdating;

  const [name, setName] = useState(place?.name ?? '');
  const [location, setLocation] = useState<PlaceLocation | null>(() =>
    toLocation(place),
  );
  const [detailAddress, setDetailAddress] = useState(
    place?.detailAddress ?? '',
  );
  // 수정 진입 시 이미 올라가 있는 커버. 새 파일을 고르거나 지우면 null이 된다.
  const [savedImageUrl, setSavedImageUrl] = useState(place?.imageUrl ?? null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { selectFile, cropDialogProps } = useImageCrop();

  // 열릴 때 폼을 초기화한다(effect 대신 렌더 중 파생).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(place?.name ?? '');
      setLocation(toLocation(place));
      setDetailAddress(place?.detailAddress ?? '');
      setSavedImageUrl(place?.imageUrl ?? null);
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
    setSavedImageUrl(null);
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
    setSavedImageUrl(null);
  };

  /** 이름이 비어 있을 때만 상호명으로 채운다. 이미 적은 이름("우리 합주실")은 덮지 않는다. */
  const applyLocation = (found: PlaceSearchResult) => {
    setLocation(found);
    if (name.trim().length === 0) setName(found.name.slice(0, 120));
  };

  const displayedCover = coverPreview ?? savedImageUrl;

  const canSubmit = name.trim().length > 0 && !isPending && !isUploading;

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

    const coordinates =
      location && location.latitude !== null && location.longitude !== null
        ? { latitude: location.latitude, longitude: location.longitude }
        : {};

    if (isEdit) {
      update(
        {
          placeId: place.placeId,
          data: {
            name: name.trim(),
            // PATCH는 안 보낸 필드를 그대로 두므로, 지운 값은 null로 보내야 지워진다.
            address: location?.address ?? null,
            ...coordinates,
            detailAddress: detailAddress.trim() || null,
            // 커버를 건드리지 않았으면 보내지 않는다(undefined = 유지).
            imageUrl: imageUrl ?? (savedImageUrl ? undefined : null),
          },
        },
        {
          onSuccess: () => {
            toast.success('연습 장소를 수정했어요.');
            onOpenChange(false);
          },
          onError: () => {
            toast.error(
              '연습 장소를 수정하지 못했어요. 잠시 후 다시 시도해주세요.',
            );
          },
        },
      );
      return;
    }

    create(
      {
        name: name.trim(),
        address: location?.address,
        ...coordinates,
        detailAddress: detailAddress.trim() || undefined,
        imageUrl,
      },
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
          연습 장소의 이름·위치·커버를 입력해 {isEdit ? '수정' : '추가'}합니다.
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
              {isEdit ? '장소 수정' : '장소 추가'}
            </SheetTitle>
            <p className="typo-base-r text-grey-300">
              {isEdit
                ? '연습 장소 정보를 수정해보세요'
                : '연습이 진행될 장소를 추가해보세요'}
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

          {isKakaoMapsAvailable && (
            <div className="flex flex-col gap-2">
              <FieldLabel size="lg">위치</FieldLabel>
              {location ? (
                <div className="flex items-center gap-3 rounded-md bg-surface-3 px-4 py-4">
                  <MapPin
                    aria-hidden="true"
                    className="size-6 shrink-0 text-grey-200"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {location.name ? (
                      <>
                        <p className="truncate typo-base-sb text-grey-50">
                          {location.name}
                        </p>
                        <p className="truncate typo-sm-r text-grey-200">
                          {location.address}
                        </p>
                      </>
                    ) : (
                      <p className="truncate typo-base-sb text-grey-50">
                        {location.address}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="위치 지우기"
                    onClick={() => setLocation(null)}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-grey-200 focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <X aria-hidden="true" className="size-5" />
                  </button>
                </div>
              ) : (
                // 입력칸 모양이면 눌러서 타이핑하는 자리로 읽힌다. 곡 추가의
                // "곡 검색"과 같은 채움 버튼으로 둬 "누르면 검색이 열린다"로 보이게 한다.
                <Button
                  type="button"
                  variant="accent"
                  size="inline"
                  className="self-start"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <MapPin aria-hidden="true" className="size-[18px]" />
                  지도에서 찾기
                </Button>
              )}
            </div>
          )}

          <Field label="상세 위치" labelSize="lg" htmlFor="place-detail">
            <Input
              id="place-detail"
              variant="underline"
              value={detailAddress}
              onChange={(event) => setDetailAddress(event.target.value)}
              placeholder="예: 지하 1층 B룸, 학생회관 3층"
              maxLength={255}
            />
          </Field>

          <div className="flex flex-col gap-2">
            <FieldLabel size="lg">장소 커버</FieldLabel>
            {displayedCover ? (
              <div className="relative size-20">
                <img
                  src={displayedCover}
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
            {isEdit ? '수정' : '추가'}
          </Button>
        </div>
      </SheetContent>

      <PlaceSearchModal
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onSelect={applyLocation}
      />

      <ImageCropDialog
        {...cropDialogProps}
        aspect={CROP_ASPECT.square}
        title="장소 커버 자르기"
        onCropped={applyCroppedCover}
      />
    </Sheet>
  );
};
