import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';
import type { Paginated } from '@/shared/api/types';

import type {
  Announcement,
  AnnouncementListQuery,
  CreateAnnouncementRequest,
  DeleteAnnouncementResult,
  UpdateAnnouncementRequest,
} from './types';

// 계약상 길이 제한
export const ANNOUNCEMENT_TITLE_MAX_LENGTH = 120;
export const ANNOUNCEMENT_CONTENT_MAX_LENGTH = 5000;

export const announcementKeys = {
  all: ['announcements'] as const,
  list: (query: AnnouncementListQuery) =>
    [...announcementKeys.all, 'list', query] as const,
};

export const getAnnouncements = (query: AnnouncementListQuery) =>
  apiGet<Paginated<Announcement>>('/admin/announcements', { params: query });

export const createAnnouncement = (body: CreateAnnouncementRequest) =>
  apiPost<Announcement>('/admin/announcements', body);

export const updateAnnouncement = (
  announcementId: string,
  body: UpdateAnnouncementRequest,
) => apiPatch<Announcement>(`/admin/announcements/${announcementId}`, body);

export const deleteAnnouncement = (announcementId: string) =>
  apiDelete<DeleteAnnouncementResult>(`/admin/announcements/${announcementId}`);

export const useAnnouncements = (query: AnnouncementListQuery) =>
  useQuery({
    queryKey: announcementKeys.list(query),
    queryFn: () => getAnnouncements(query),
    placeholderData: keepPreviousData,
  });

const useInvalidateAnnouncements = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: announcementKeys.all });
};

export const useCreateAnnouncement = () => {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({ mutationFn: createAnnouncement, onSuccess: invalidate });
};

export const useUpdateAnnouncement = () => {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({
    mutationFn: ({
      announcementId,
      body,
    }: {
      announcementId: string;
      body: UpdateAnnouncementRequest;
    }) => updateAnnouncement(announcementId, body),
    onSuccess: invalidate,
  });
};

export const useDeleteAnnouncement = () => {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({ mutationFn: deleteAnnouncement, onSuccess: invalidate });
};
