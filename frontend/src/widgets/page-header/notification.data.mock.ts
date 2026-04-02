import type { NotificationPreview } from './notification.data';

export const notificationPreviewsMock: NotificationPreview[] = [
  {
    notificationId: 'notice-1',
    type: 'NOTICE',
    title: '합주방 공지 업데이트',
    description: '이번 주 합주실 사용 공지가 새로 등록되었어요.',
    isRead: false,
  },
  {
    notificationId: 'invite-indie',
    type: 'INVITE',
    title: '인디 밴드 초대장 도착!',
    description: '밴드에 참여하려면 초대를 확인해 주세요.',
    isRead: false,
  },
  {
    notificationId: 'invite-sinsa',
    type: 'INVITE',
    title: '신촌 락밴드 초대장 도착!',
    description: '새 밴드 초대가 도착했어요. 내용을 확인해 주세요.',
    isRead: true,
  },
  {
    notificationId: 'reminder-1',
    type: 'REMINDER',
    title: '합주 일정 임박',
    description: '내일 저녁 8시에 합주 일정이 있어요.',
    isRead: false,
  },
];
