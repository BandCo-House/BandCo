import { useMutation } from '@tanstack/react-query';

import { apiPost } from '@/shared/api/client';

import type { BroadcastResult, SendNotificationRequest } from './types';

// 계약상 알림 제목 최대 길이
export const NOTIFICATION_TITLE_MAX_LENGTH = 120;

export const broadcastNotification = (body: SendNotificationRequest) =>
  apiPost<BroadcastResult>('/admin/notifications/broadcast', body);

export const useBroadcastNotification = () =>
  useMutation({ mutationFn: broadcastNotification });

/** 빈 선택 필드는 보내지 않는다. */
export const toSendNotificationRequest = (form: {
  title: string;
  description: string;
  targetPath: string;
}): SendNotificationRequest => ({
  title: form.title.trim(),
  description: form.description.trim() || undefined,
  targetPath: form.targetPath.trim() || undefined,
});
