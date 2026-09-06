import { http, HttpResponse } from 'msw';
import type { ApiSuccessResponse } from '@/shared/api';
import type { BandNotice } from '@/entities/notice/model/types';
import { API_URL } from '../config';

// 임시 mock 공지 (백엔드 API 미제공). 최신순 정렬 + size 파라미터로 잘라 응답한다.
const notices: BandNotice[] = [
  {
    id: '1',
    content: '다음 정기 모임: 2월 20일 (목) 오후 7시',
    createdAt: '2026-02-13T10:00:00+09:00',
  },
  {
    id: '2',
    content: '회비 납부 기한: 2월 28일까지',
    createdAt: '2026-02-13T09:00:00+09:00',
  },
  {
    id: '3',
    content: '합주실 예약 규칙이 변경되었습니다',
    createdAt: '2026-02-10T09:00:00+09:00',
  },
  {
    id: '4',
    content: '신규 곡 악보가 업로드되었습니다',
    createdAt: '2026-02-05T09:00:00+09:00',
  },
];

export const noticeHandlers = [
  http.get(`${API_URL}/bands/:bandId/notices`, ({ request }) => {
    const url = new URL(request.url);
    const size = Number(url.searchParams.get('size'));
    const sorted = [...notices].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    const items =
      Number.isFinite(size) && size > 0 ? sorted.slice(0, size) : sorted;

    return HttpResponse.json<ApiSuccessResponse<{ items: BandNotice[] }>>({
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { items },
    });
  }),
];
