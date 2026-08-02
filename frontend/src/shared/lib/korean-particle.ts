/**
 * 한글 단어의 받침 유무에 따라 적절한 조사(은/는, 이/가, 을/를 등)를 선택해 줍니다.
 */
export function getKoreanParticle(
  text: string,
  particleType: '은/는' | '이/가' | '을/를',
): string {
  if (!text) return '';
  const lastChar = text.charAt(text.length - 1);
  const code = lastChar.charCodeAt(0);

  // 한글 음절 범위: 0xAC00 ~ 0xD7A3
  let hasJongseong = false;
  if (code >= 0xac00 && code <= 0xd7a3) {
    hasJongseong = (code - 0xac00) % 28 !== 0;
  }

  if (particleType === '은/는') {
    return hasJongseong ? '은' : '는';
  }
  if (particleType === '이/가') {
    return hasJongseong ? '이' : '가';
  }
  if (particleType === '을/를') {
    return hasJongseong ? '을' : '를';
  }

  return '';
}
