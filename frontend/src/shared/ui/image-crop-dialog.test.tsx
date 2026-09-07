import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CROP_ASPECT, ImageCropDialog } from './image-crop-dialog';

const file = new File(['x'], 'photo.png', { type: 'image/png' });

const renderDialog = (onOpenChange = vi.fn()) => {
  render(
    <ImageCropDialog
      open
      file={file}
      aspect={CROP_ASPECT.square}
      onOpenChange={onOpenChange}
      onCropped={vi.fn()}
    />,
  );
  return onOpenChange;
};

describe('ImageCropDialog', () => {
  it('제목과 키보드로 조작 가능한 확대 슬라이더를 제공한다', () => {
    renderDialog();

    expect(
      screen.getByRole('heading', { name: '이미지 자르기' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: '확대' })).toBeInTheDocument();
  });

  it('크롭 영역이 정해지기 전에는 적용을 누를 수 없다', () => {
    renderDialog();

    expect(screen.getByRole('button', { name: '적용' })).toBeDisabled();
  });

  it('취소하면 원본을 넘기지 않고 닫는다', async () => {
    const onOpenChange = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: '취소' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
