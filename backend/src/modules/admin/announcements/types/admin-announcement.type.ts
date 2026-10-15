/** 어드민 공지 응답 형식 */
export type AdminAnnouncement = {
  announcementId: string;
  title: string;
  content: string;
  isPublished: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { adminId: string; name: string };
};

/** 공지 생성 요청값. 게시 기간은 ISO 8601 문자열이며 없으면 제한 없음이다. */
export type CreateAnnouncementInput = {
  title: string;
  content: string;
  isPublished: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

/** 공지 수정 요청값. undefined는 변경 없음, 게시 기간의 null은 제한 해제다. */
export type UpdateAnnouncementInput = {
  title?: string;
  content?: string;
  isPublished?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

/** 공지 생성 시 저장할 값 */
export type CreateAnnouncementData = {
  title: string;
  content: string;
  isPublished: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdByAdminId: string;
};

/** 공지 수정 시 저장할 값. undefined 필드는 바꾸지 않는다. */
export type UpdateAnnouncementData = {
  title?: string;
  content?: string;
  isPublished?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
};
