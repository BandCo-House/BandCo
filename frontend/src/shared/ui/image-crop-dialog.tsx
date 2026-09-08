import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Slider } from 'radix-ui';
import { toast } from 'sonner';
import { cropImageToFile, type CropAreaPixels } from '@/shared/lib/crop-image';
import { Button } from '@/shared/ui/button';
import {
  AppDialogContent,
  AppDialogFooter,
  AppDialogHeader,
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog';

/**
 * 커버 썸네일은 전부 정사각으로 렌더된다(BandCard·SongCoverField 등).
 * 프로필만 세로 배너인데, 컨테이너 높이가 카드 내용에 따라 달라져(측정값 376x683)
 * 딱 맞는 비율이 없다. 컨테이너보다 **넓은** 3:4를 쓰면 object-cover가 항상 가로를
 * 꽉 채우고 아래만 잘라내므로, 잘리는 부분이 유리 카드에 가려진 영역과 겹친다.
 */
export const CROP_ASPECT = {
  square: 1,
  profileBanner: 3 / 4,
} as const;

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.01;

interface ImageCropDialogProps {
  open: boolean;
  /** 크롭할 원본. 닫힌 동안에는 null이다. */
  file: File | null;
  aspect: number;
  cropShape?: 'rect' | 'round';
  title?: string;
  onOpenChange: (open: boolean) => void;
  /** 확인을 누르면 잘린 JPEG File을 넘긴다. 원본은 버려진다. */
  onCropped: (file: File) => void;
}

/**
 * 업로드 전 이미지를 잘라내는 공통 모달.
 * 제스처(드래그·핀치·휠)는 react-easy-crop이 맡고, 캔버스 렌더와 JPEG 인코딩은
 * `crop-image.ts`가 맡는다 — 출력 해상도·용량을 우리가 계속 쥐고 있기 위해서다.
 */
export const ImageCropDialog = ({
  open,
  file,
  aspect,
  cropShape = 'rect',
  title = '이미지 자르기',
  onOpenChange,
  onCropped,
}: ImageCropDialogProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [area, setArea] = useState<CropAreaPixels | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // 파일이 바뀔 때마다 blob URL을 새로 만들고 이전 것은 즉시 반납한다.
  useEffect(() => {
    if (!file) {
      setImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setCrop({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    setArea(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!file || !area) return;
    setIsCropping(true);
    try {
      onCropped(await cropImageToFile(file, area));
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '이미지를 자르지 못했어요.',
      );
    } finally {
      setIsCropping(false);
    }
  };

  // Radix는 Esc·바깥 클릭에서도 onOpenChange(false)를 부른다. 버튼만 잠그면
  // 그 두 경로로 대기 파일이 비워진 뒤 크롭 결과가 도착해, 취소한 이미지가
  // 그대로 폼에 실린다. 닫기 요청 자체를 여기서 막는다.
  const handleOpenChange = (next: boolean) => {
    if (!next && isCropping) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <AppDialogContent size="full">
        <AppDialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="typo-sm-r text-grey-200">
            드래그해서 위치를, 확대 슬라이더로 크기를 맞춰주세요.
          </DialogDescription>
        </AppDialogHeader>

        {/* Cropper는 position:absolute로 부모를 채우므로 높이를 가진 relative 박스가 필요하다. */}
        <div className="relative z-10 h-72 w-full overflow-hidden rounded-md bg-gradient-bottom">
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          )}
        </div>

        {/* 핀치·휠은 키보드로 쓸 수 없어서, 확대는 Radix Slider로도 조작할 수 있게 둔다. */}
        <Slider.Root
          className="relative z-10 mt-4 flex h-5 w-full touch-none items-center select-none"
          value={[zoom]}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          onValueChange={([next]) => setZoom(next)}
        >
          <Slider.Track className="relative h-1 grow rounded-full bg-surface-1">
            <Slider.Range className="absolute h-full rounded-full bg-primary" />
          </Slider.Track>
          {/* role="slider"와 값 속성은 Thumb에 붙으므로 접근성 이름도 Root가 아니라 여기에 둔다. */}
          <Slider.Thumb
            aria-label="확대"
            className="block size-5 rounded-full bg-primary focus-visible:outline-2 focus-visible:outline-grey-50"
          />
        </Slider.Root>

        <AppDialogFooter className="mt-6 flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="pill"
            className="border-grey-50 typo-base-b text-grey-50"
            disabled={isCropping}
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="shining"
            size="pill"
            className="typo-base-sb"
            disabled={!area}
            isLoading={isCropping}
            loadingContent="자르는 중..."
            onClick={() => void handleConfirm()}
          >
            적용
          </Button>
        </AppDialogFooter>
      </AppDialogContent>
    </Dialog>
  );
};
