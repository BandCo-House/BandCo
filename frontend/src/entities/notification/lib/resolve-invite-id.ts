import type { NotificationItem } from '../model/types';

/**
 * 알림 객체의 reference.id 또는 targetPathQuery에서 invitationId를 추출한다.
 */
export const resolveInviteId = (
  noti?: Pick<NotificationItem, 'reference' | 'targetPath'> | null,
): string => {
  if (!noti) return '';
  if (noti.reference?.id) return noti.reference.id;
  if (noti.targetPath) {
    const searchParams = new URLSearchParams(
      noti.targetPath.split('?')[1] ?? '',
    );
    const invitationId = searchParams.get('invitationId');
    if (invitationId) return invitationId;
  }
  return '';
};
