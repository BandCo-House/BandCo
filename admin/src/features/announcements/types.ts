import type { AdminRef } from '@/features/users/types';
import type { PageQuery } from '@/shared/api/types';

export interface Announcement {
  announcementId: string;
  title: string;
  content: string;
  isPublished: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: AdminRef;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  isPublished: boolean;
  startsAt?: string;
  endsAt?: string;
}

/** 부분 수정. 게시 기간을 비우려면 null을 보낸다. */
export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  isPublished?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface DeleteAnnouncementResult {
  announcementId: string;
}

export type AnnouncementListQuery = PageQuery;

/** 화면 표시용 게시 상태 (클라이언트 계산) */
export type AnnouncementState = 'ACTIVE' | 'SCHEDULED' | 'ENDED' | 'PRIVATE';
