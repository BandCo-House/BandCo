import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ActiveAnnouncement } from '@/entities/announcement/model/schema';
import { announcementKeys } from '@/entities/announcement/api/useActiveAnnouncements';
import { API_URL } from '@/mocks/config';
import { server } from '@/mocks/server';
import { AnnouncementBanner } from './AnnouncementBanner';

const ANNOUNCEMENTS: ActiveAnnouncement[] = [
  {
    announcementId: 'notice-1',
    title: '정기 점검 안내',
    content: '10월 10일 02:00 ~ 04:00\n점검 중에는 이용할 수 없어요.',
    startsAt: null,
    endsAt: null,
  },
  {
    announcementId: 'notice-2',
    title: '새 기능 출시',
    content: '합주 투표가 추가됐어요.',
    startsAt: null,
    endsAt: null,
  },
];

const respondAnnouncements = (announcements: ActiveAnnouncement[]) =>
  http.get(`${API_URL}/announcements/active`, () =>
    HttpResponse.json({
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { announcements },
    }),
  );

const renderBanner = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <AnnouncementBanner />
    </QueryClientProvider>,
  );
  return { ...result, queryClient };
};

beforeEach(() => {
  localStorage.clear();
});

describe('AnnouncementBanner', () => {
  it('게시 중인 공지 제목을 목록으로 보여준다', async () => {
    server.use(respondAnnouncements(ANNOUNCEMENTS));
    renderBanner();

    const region = await screen.findByRole('region', { name: '서비스 공지' });
    expect(within(region).getAllByRole('listitem')).toHaveLength(2);
    expect(
      within(region).getByRole('button', { name: '정기 점검 안내' }),
    ).toBeInTheDocument();
  });

  it('공지를 누르면 줄바꿈을 유지한 전체 내용을 모달로 보여준다', async () => {
    const user = userEvent.setup();
    server.use(respondAnnouncements(ANNOUNCEMENTS));
    renderBanner();

    await user.click(
      await screen.findByRole('button', { name: '정기 점검 안내' }),
    );

    const dialog = await screen.findByRole('dialog', {
      name: '정기 점검 안내',
    });
    // 기본 normalizer는 줄바꿈을 공백으로 접으므로 원문 그대로 비교한다.
    expect(
      within(dialog).getByText(
        '10월 10일 02:00 ~ 04:00\n점검 중에는 이용할 수 없어요.',
        { normalizer: (text) => text },
      ),
    ).toBeInTheDocument();
  });

  it('닫은 공지는 숨기고 다시 렌더해도 이 브라우저에서는 보이지 않는다', async () => {
    const user = userEvent.setup();
    server.use(respondAnnouncements(ANNOUNCEMENTS));
    const { unmount } = renderBanner();

    const [firstDismissButton] = await screen.findAllByRole('button', {
      name: '공지 닫기',
    });
    await user.click(firstDismissButton);

    expect(
      screen.queryByRole('button', { name: '정기 점검 안내' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '새 기능 출시' }),
    ).toBeInTheDocument();

    unmount();
    renderBanner();

    expect(
      await screen.findByRole('button', { name: '새 기능 출시' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '정기 점검 안내' }),
    ).not.toBeInTheDocument();
  });

  it('저장된 값이 깨져 있어도 공지를 그대로 보여준다', async () => {
    localStorage.setItem('jamplay_dismissed_announcements', '{broken');
    server.use(respondAnnouncements(ANNOUNCEMENTS));
    renderBanner();

    expect(
      await screen.findByRole('button', { name: '정기 점검 안내' }),
    ).toBeInTheDocument();
  });

  it('공지가 없으면 아무것도 그리지 않는다', async () => {
    server.use(respondAnnouncements([]));
    const { container, queryClient } = renderBanner();

    await waitFor(() =>
      expect(queryClient.getQueryState(announcementKeys.active())?.status).toBe(
        'success',
      ),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('조회에 실패하면 아무것도 그리지 않는다', async () => {
    server.use(
      http.get(`${API_URL}/announcements/active`, () =>
        HttpResponse.json(
          {
            status: 'fail',
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              details: { statusCode: 500 },
            },
            message: '서버 오류',
            data: {},
          },
          { status: 500 },
        ),
      ),
    );
    const { container, queryClient } = renderBanner();

    await waitFor(() =>
      expect(queryClient.getQueryState(announcementKeys.active())?.status).toBe(
        'error',
      ),
    );
    expect(container).toBeEmptyDOMElement();
  });
});
