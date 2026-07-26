import axios from 'axios';

type ApiErrorBody = {
  message?: string | string[];
};

/**
 * axios 에러에서 사용자에게 보여줄 메시지를 뽑는다.
 *
 * 서버 유효성 검사가 여러 건 실패하면 message가 배열로 오므로 줄바꿈으로 합친다.
 * @param error catch로 받은 값
 * @param fallbackMessage 서버 메시지가 없을 때 쓸 문구
 */
export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return fallbackMessage;
  }

  const { message } = error.response?.data ?? {};
  const joinedMessage = Array.isArray(message) ? message.join('\n') : message;

  return joinedMessage?.trim() ? joinedMessage : fallbackMessage;
};
