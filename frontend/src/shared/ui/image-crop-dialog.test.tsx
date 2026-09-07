import { useEffect } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { cropImageToFile } from '@/shared/lib/crop-image';
import { CROP_ASPECT, ImageCropDialog } from './image-crop-dialog';

vi.mock('@/shared/lib/crop-image', () => ({ cropImageToFile: vi.fn() }));

// jsdom은 이미지를 로드하지 않아 실제 Cropper의 onCropComplete가 끝내 오지 않는다.
// 크롭 영역이 정해진 뒤의 동작을 보려면 그 콜백을 대신 쏴 줘야 한다.
vi.mock('react-easy-crop', () => {
  // vi.mock은 호이스팅되므로 stub을 팩토리 안에 둔다. 이름을 대문자로 시작해야
  // rules-of-hooks가 useEffect를 컴포넌트 안의 호출로 인정한다.
  const CropperStub = ({
    onCropComplete,
  }: {
    onCropComplete?: (a: unknown, b: unknown) => void;
  }) => {
    useEffect(() => {
      onCropComplete?.(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 0, y: 0, width: 10, height: 10 },
      );
    }, [onCropComplete]);
    return <div data-testid="cropper" />;
  };
  return { default: CropperStub };
});
vi.mock('react-easy-crop/react-easy-crop.css', () => ({}));

const file = new File(['x'], 'photo.png', { type: 'image/png' });

const renderDialog = (
  props: Partial<Parameters<typeof ImageCropDialog>[0]> = {},
) => {
  const onOpenChange = vi.fn();
  const onCropped = vi.fn();
  render(
    <ImageCropDialog
      open
      file={file}
      aspect={CROP_ASPECT.square}
      onOpenChange={onOpenChange}
      onCropped={onCropped}
      {...props}
    />,
  );
  return { onOpenChange, onCropped };
};

beforeEach(() => {
  vi.mocked(cropImageToFile).mockReset();
});

describe('ImageCropDialog', () => {
  it('제목과 키보드로 조작 가능한 확대 슬라이더를 제공한다', () => {
    renderDialog();

    expect(
      screen.getByRole('heading', { name: '이미지 자르기' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: '확대' })).toBeInTheDocument();
  });

  it('취소하면 원본을 넘기지 않고 닫는다', async () => {
    const { onOpenChange, onCropped } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: '취소' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onCropped).not.toHaveBeenCalled();
  });

  it('적용하면 잘린 파일을 넘기고 닫는다', async () => {
    const cropped = new File(['y'], 'photo.jpg', { type: 'image/jpeg' });
    vi.mocked(cropImageToFile).mockResolvedValue(cropped);
    const { onOpenChange, onCropped } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: '적용' }));

    expect(onCropped).toHaveBeenCalledWith(cropped);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // Esc·바깥 클릭은 취소 버튼을 우회하므로, 여기서 막히지 않으면 대기 파일이 비워진 뒤
  // 크롭 결과가 도착해 취소한 이미지가 폼에 실린다.
  it('자르는 중에는 Esc로 닫히지 않는다', async () => {
    let finishCrop: (file: File) => void = () => {};
    vi.mocked(cropImageToFile).mockReturnValue(
      new Promise<File>((resolve) => {
        finishCrop = resolve;
      }),
    );
    const { onOpenChange } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: '적용' }));
    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).not.toHaveBeenCalled();

    // 걸어 둔 크롭을 풀어 두지 않으면 다음 테스트로 act 경고가 샌다.
    await act(async () => {
      finishCrop(new File(['y'], 'photo.jpg', { type: 'image/jpeg' }));
    });
  });
});
