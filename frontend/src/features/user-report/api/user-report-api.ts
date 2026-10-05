import { apiPost } from '@/shared/api';
import {
  createUserReportResponseSchema,
  type CreateUserReportRequest,
  type CreateUserReportResponse,
} from '../model/report';

/**
 * 다른 유저를 신고한다(POST /users/:userId/reports).
 * 본인 신고 400, 대상 없음 404, 같은 대상에 처리 대기 신고가 있으면 409.
 */
export const createUserReport = async (
  userId: string,
  body: CreateUserReportRequest,
): Promise<CreateUserReportResponse> => {
  const data = await apiPost<unknown>(
    `/users/${encodeURIComponent(userId)}/reports`,
    body,
  );
  return createUserReportResponseSchema.parse(data);
};
