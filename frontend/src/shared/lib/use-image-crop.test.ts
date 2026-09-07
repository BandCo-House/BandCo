import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { useImageCrop } from './use-image-crop';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const makeFile = (type: string, size = 1024) => {
  const file = new File(['x'], 'photo', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('useImageCrop', () => {
  it('이미지 파일을 고르면 크롭 모달이 열린다', () => {
    const { result } = renderHook(() => useImageCrop());

    act(() => result.current.selectFile(makeFile('image/png')));

    expect(result.current.cropDialogProps.open).toBe(true);
  });

  it('이미지가 아닌 파일은 모달을 열지 않고 이유를 알린다', () => {
    const { result } = renderHook(() => useImageCrop());

    act(() => result.current.selectFile(makeFile('application/pdf')));

    expect(result.current.cropDialogProps.open).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      '이미지 파일만 첨부할 수 있습니다.',
    );
  });

  it('모달을 닫으면 대기 중이던 파일을 버린다', () => {
    const { result } = renderHook(() => useImageCrop());
    act(() => result.current.selectFile(makeFile('image/png')));

    act(() => result.current.cropDialogProps.onOpenChange(false));

    expect(result.current.cropDialogProps.open).toBe(false);
    expect(result.current.cropDialogProps.file).toBeNull();
  });
});
