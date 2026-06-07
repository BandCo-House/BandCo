const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1600;

export async function compressProfileImage(
  file: File,
): Promise<{ file: File; previewUrl: string }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 첨부할 수 있습니다.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('프로필 이미지는 5MB 이하로 첨부해주세요.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('이미지를 처리할 수 없습니다.');
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('이미지를 압축할 수 없습니다.'));
      },
      'image/jpeg',
      0.82,
    );
  });

  const compressedFile = new File(
    [blob],
    file.name.replace(/\.[^.]+$/, '') + '.jpg',
    { type: 'image/jpeg' },
  );

  return {
    file: compressedFile,
    previewUrl: URL.createObjectURL(compressedFile),
  };
}
