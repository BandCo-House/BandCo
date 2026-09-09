/** 크롭 결과 좌표. react-easy-crop의 `croppedAreaPixels`와 같은 형태다. */
export interface CropAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** 긴 변 상한. 커버·배너 모두 이 이상 해상도를 쓰는 화면이 없다. */
const MAX_IMAGE_EDGE = 1600;
const JPEG_QUALITY = 0.82;
const OUTPUT_TYPE = 'image/jpeg';

/** 업로드 전 파일 자체를 거른다. 통과하지 못하면 사용자에게 그대로 보여줄 수 있는 메시지로 던진다. */
export const assertUploadableImage = (file: File): void => {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 첨부할 수 있습니다.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('이미지는 5MB 이하로 첨부해주세요.');
  }
};

/**
 * EXIF orientation을 반영해 디코딩한다.
 *
 * 기본값(`from-image`가 없을 때)은 orientation 태그를 무시해서, 아이폰 세로 사진이
 * 캔버스에서만 눕는다. 화면의 <img>는 브라우저가 자동 회전시켜 보여주므로
 * 크롭 좌표는 회전된 기준으로 잡히는데, 캔버스만 안 돌면 엉뚱한 영역이 잘린다.
 */
const decodeOriented = (file: File): Promise<ImageBitmap> =>
  createImageBitmap(file, { imageOrientation: 'from-image' });

/**
 * 선택 영역을 잘라 JPEG File로 만든다. 긴 변이 MAX_IMAGE_EDGE를 넘으면 함께 축소한다.
 * 업로드는 `file.type`으로 presigned를 받으므로 호출부는 이 File을 그대로 넘기면 된다.
 */
export const cropImageToFile = async (
  file: File,
  area: CropAreaPixels,
): Promise<File> => {
  assertUploadableImage(file);

  const bitmap = await decodeOriented(file);
  try {
    // 좌표는 표시 이미지 기준 실수로 오므로 정수로 맞추고, 회전·반올림 오차로
    // 비트맵 밖을 가리키는 경우를 막아 한 번 잘라 둔다(0px이면 drawImage가 던진다).
    const sx = Math.max(0, Math.round(area.x));
    const sy = Math.max(0, Math.round(area.y));
    const sw = Math.max(1, Math.min(Math.round(area.width), bitmap.width - sx));
    const sh = Math.max(
      1,
      Math.min(Math.round(area.height), bitmap.height - sy),
    );

    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(sw, sh));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sw * scale));
    canvas.height = Math.max(1, Math.round(sh * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('이미지를 처리할 수 없습니다.');
    }
    context.drawImage(
      bitmap,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, OUTPUT_TYPE, JPEG_QUALITY);
    });
    if (!blob) {
      throw new Error('이미지를 처리할 수 없습니다.');
    }

    return new File([blob], toJpegName(file.name), { type: OUTPUT_TYPE });
  } finally {
    bitmap.close();
  }
};

const toJpegName = (name: string): string =>
  `${name.replace(/\.[^.]+$/, '') || 'image'}.jpg`;
