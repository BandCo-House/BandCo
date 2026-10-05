import { useMutation } from '@tanstack/react-query';
import { createUserReport } from '../api/user-report-api';
import type { CreateUserReportRequest } from './report';

/** 신고는 화면에 다시 보여 줄 목록이 없어 무효화할 캐시가 없다. */
export const useCreateUserReport = (reportedUserId: string) =>
  useMutation({
    mutationFn: (body: CreateUserReportRequest) =>
      createUserReport(reportedUserId, body),
  });
