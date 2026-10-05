import { http, HttpResponse } from 'msw';
import type { ApiSuccessResponse } from '@/shared/api';
import type { CreateUserReportResponse } from '@/features/user-report/model/report';
import { API_URL } from '../config';

export const userReportHandlers = [
  http.post(`${API_URL}/users/:userId/reports`, () =>
    HttpResponse.json<ApiSuccessResponse<CreateUserReportResponse>>(
      {
        status: 'success',
        error: null,
        message: '신고가 접수되었습니다.',
        data: { reportId: 'c3d4e5f6-0000-4000-8000-000000000001' },
      },
      { status: 201 },
    ),
  ),
];
