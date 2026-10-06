import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cropImageToFile } from './crop-image';

const makeFile = ({
  type = 'image/png',
  size = 1024,
  name = 'photo.png',
} = {}): File => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const drawImage = vi.fn();
const toBlob = vi.fn();
const close = vi.fn();

/** bitmap 크기를 바꿔 가며 캔버스 호출 인자를 관찰한다. jsdom에는 두 API 모두 없다. */
const stubImagePipeline = (bitmap: { width: number; height: number }) => {
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn().mockResolvedValue({ ...bitmap, close }),
  );

  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage }),
    toBlob: (cb: (blob: Blob) => void) => {
      toBlob();
      cb(new Blob(['jpeg'], { type: 'image/jpeg' }));
    },
  };
  vi.spyOn(document, 'createElement').mockReturnValue(
    canvas as unknown as HTMLElement,
  );
  return canvas;
};

beforeEach(() => {
  drawImage.mockClear();
  toBlob.mockClear();
  close.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('cropImageToFile', () => {
  it('이미지가 아닌 파일은 디코딩하기 전에 거부한다', async () => {
    stubImagePipeline({ width: 100, height: 100 });

    await expect(
      cropImageToFile(makeFile({ type: 'application/pdf' }), {
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      }),
    ).rejects.toThrow('이미지 파일만 첨부할 수 있습니다.');
    expect(drawImage).not.toHaveBeenCalled();
  });

  it('5MB를 넘는 파일은 거부한다', async () => {
    stubImagePipeline({ width: 100, height: 100 });

    await expect(
      cropImageToFile(makeFile({ size: 5 * 1024 * 1024 + 1 }), {
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      }),
    ).rejects.toThrow('5MB 이하');
  });

  it('EXIF orientation을 반영해 디코딩한다', async () => {
    stubImagePipeline({ width: 100, height: 200 });

    await cropImageToFile(makeFile(), { x: 0, y: 0, width: 100, height: 100 });

    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(File), {
      imageOrientation: 'from-image',
    });
  });

  it('비트맵 밖을 가리키는 좌표는 경계 안으로 잘라 낸다', async () => {
    stubImagePipeline({ width: 100, height: 100 });

    // 반올림 오차로 원본 폭을 2px 넘어서는 영역.
    await cropImageToFile(makeFile(), {
      x: 10.4,
      y: 10.6,
      width: 95,
      height: 95,
    });

    expect(drawImage).toHaveBeenCalledWith(
      expect.anything(),
      10,
      11,
      90,
      89,
      0,
      0,
      90,
      89,
    );
  });

  it('긴 변이 1600px을 넘으면 비율을 유지한 채 축소한다', async () => {
    const canvas = stubImagePipeline({ width: 4000, height: 3000 });

    await cropImageToFile(makeFile(), {
      x: 0,
      y: 0,
      width: 3200,
      height: 1600,
    });

    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(800);
  });

  it('원본 확장자와 무관하게 jpeg File을 돌려주고 비트맵을 해제한다', async () => {
    stubImagePipeline({ width: 100, height: 100 });

    const result = await cropImageToFile(makeFile({ name: 'IMG_0001.HEIC' }), {
      x: 0,
      y: 0,
      width: 50,
      height: 50,
    });

    expect(result.name).toBe('IMG_0001.jpg');
    expect(result.type).toBe('image/jpeg');
    expect(close).toHaveBeenCalled();
  });
});
