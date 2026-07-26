import axios from 'axios';

/**
 * 문자열 또는 문자열 배열만 메시지로 인정한다. 배열은 줄바꿈으로 합친다.
 *
 * 서버 응답 본문은 런타임에 형태가 보장되지 않으므로, 숫자·객체·혼합 배열은
 * 메시지로 쓰지 않는다(문자열이 아닌 값에 trim을 호출하면 TypeError가 난다).
 */
const normalizeMessage = (message: unknown): string | undefined => {
  if (typeof message === 'string') {
    return message;
  }

  if (
    Array.isArray(message) &&
    message.every((item) => typeof item === 'string')
  ) {
    return message.join('\n');
  }

  return undefined;
};

/**
 * axios 에러에서 사용자에게 보여줄 메시지를 뽑는다.
 *
 * 서버 유효성 검사가 여러 건 실패하면 message가 배열로 오므로 줄바꿈으로 합친다.
 * @param error catch로 받은 값
 * @param fallbackMessage 서버 메시지가 없거나 형식을 신뢰할 수 없을 때 쓸 문구
 */
export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const data: unknown = error.response?.data;
  const message =
    typeof data === 'object' && data !== null && 'message' in data
      ? normalizeMessage((data as { message: unknown }).message)
      : undefined;

  return message?.trim() ? message : fallbackMessage;
};
