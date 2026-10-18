import { useEffect, useState, type ChangeEvent } from 'react';
import { MapPin, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFile } from '@/shared/api';
import { useUpdatePlace } from '@/entities/place/api/useUpdatePlace';
import type { Place } from '@/entities/place/model/types';
import { SheetTitle } from '@/shared/ui/sheet';
import { CROP_ASPECT, ImageCropDialog } from '@/shared/ui/image-crop-dialog';
import { useImageCrop } from '@/shared/lib/use-image-crop';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Field, FieldLabel } from '@/shared/ui/field';
import { ThumbnailRemoveButton } from '@/shared/ui/thumbnail-remove-button';
import {
  AddressSearchModal,
  type AddressSelection,
} from './AddressSearchModal';

interface PlaceFormViewProps {
  /** 수정할 장소. 값이 폼에 미리 채워진다. */
  place: Place;
  onCancel: () => void;
  /** 저장에 성공하면 저장된 장소 ID와 함께 부른다. */
  onSaved: (placeId: string) => void;
}

/**
 * 폼이 들고 있는 위치. 지도 검색으로 고르면 좌표가 있고,
 * 예전에 손으로 적은 주소를 수정하러 들어오면 주소만 있다.
 */
interface PlaceLocation {
  address: string;
  latitude: number | null;
  longitude: number | null;
}

const toLocation = (place: Place): PlaceLocation | null =>
  place.address
    ? {
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
      }
    : null;

/**
 * 연습 장소 수정 폼(본문 + 하단 버튼). 풀스크린 시트 안에 넣어 쓴다.
 * 추가는 PlaceCreateModal이 맡는다. 위치는 AddressSearchModal(카카오맵)에서 골라
 * 주소와 좌표가 함께 들어온다. 커버는 presigned 업로드로 objectUrl을 받아 imageUrl로 전송한다.
 *
 * 시트가 열릴 때마다 새로 마운트되므로 초기화 로직을 따로 두지 않는다.
 */
export const PlaceFormView = ({ place, onCancel, onSaved }: PlaceFormViewProps) => {
  const { mutate: update, isPending } = useUpdatePlace();

  const [name, setName] = useState(place.name);
  const [location, setLocation] = useState<PlaceLocation | null>(() =>
    toLocation(place),
  );
  const [detailAddress, setDetailAddress] = useState(
    place.detailAddress ?? '',
  );
  // 이미 올라가 있는 커버. 새 파일을 고르거나 지우면 null이 된다.
  const [savedImageUrl, setSavedImageUrl] = useState(place.imageUrl ?? null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { selectFile, cropDialogProps } = useImageCrop();

  // 미리보기 blob URL은 값이 바뀌거나 언마운트될 때 revoke한다.
  // (재선택·취소·닫힘 모두 여기서 한 번에 해제)
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

  /** 검색 모달에서 상세주소를 적었으면 그 값으로, 비워 뒀으면 기존 상세 위치를 유지한다. */
  const applyLocation = (selection: AddressSelection) => {
    setLocation({
      address: selection.address,
      latitude: selection.latitude,
      longitude: selection.longitude,
    });
    if (selection.detailAddress) setDetailAddress(selection.detailAddress);
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
        onSuccess: (updated) => {
          toast.success('연습 장소를 수정했어요.');
          onSaved(updated.placeId);
        },
        onError: () => {
          toast.error(
            '연습 장소를 수정하지 못했어요. 잠시 후 다시 시도해주세요.',
          );
        },
      },
    );
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-9 overflow-y-auto px-5 pt-8 pb-6">
        <div className="flex flex-col gap-2">
          <SheetTitle className="typo-xl-sb text-grey-50">장소 수정</SheetTitle>
          <p className="typo-base-r text-grey-300">
            연습 장소 정보를 수정해보세요
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

        <div className="flex flex-col gap-2">
          <FieldLabel size="lg">위치</FieldLabel>
          {location ? (
            <div className="flex items-center gap-3 rounded-md bg-surface-3 px-4 py-4">
              <MapPin
                aria-hidden="true"
                className="size-6 shrink-0 text-grey-200"
              />
              <p className="min-w-0 flex-1 truncate typo-base-sb text-grey-50">
                {location.address}
              </p>
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
          onClick={onCancel}
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
          수정
        </Button>
      </div>

      <AddressSearchModal
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
    </>
  );
};
