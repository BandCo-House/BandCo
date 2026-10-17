import type { NotificationReferenceType, NotificationType } from 'src/generated/prisma';

export type AdminNotification = {
  notificationId: string;
  type: NotificationType;
  title: string;
  description: string | null;
  targetPath: string | null;
  isRead: boolean;
  /** 컬럼이 nullable이라 예전 데이터는 null일 수 있다. */
  createdAt: string | null;
};

/** 관리자가 직접 쓰는 알림 본문 */
export type AdminNoticeContent = {
  title: string;
  description?: string;
  targetPath?: string;
};

/** 알림 한 건을 저장할 때 필요한 값. 재발송은 원본의 참조 정보까지 그대로 복사한다. */
export type CreateAdminNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  description: string | null;
  targetPath: string | null;
  referenceType: NotificationReferenceType | null;
  referenceId: string | null;
};

export type AdminNotificationIdResult = {
  notificationId: string;
};

export type BroadcastAdminNotificationResult = {
  sentCount: number;
};

/** 재발송 원본. 수신자가 탈퇴했는지도 함께 본다. */
export type AdminNotificationSource = CreateAdminNotificationInput & {
  isRecipientDeleted: boolean;
};
