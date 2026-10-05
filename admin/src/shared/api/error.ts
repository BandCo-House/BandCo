import axios from 'axios';

/** 문자열 또는 문자열 배열만 메시지로 인정한다. 배열은 줄바꿈으로 합친다. */
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
 * axios 에러에서 실패 봉투의 message를 뽑는다. 없으면 fallbackMessage를 쓴다.
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
