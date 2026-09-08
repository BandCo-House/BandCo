import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type {
  ScheduleDetail,
  ScheduleType,
} from '@/entities/schedule/model/types';
import { ScheduleDetailView } from './ScheduleDetailView';

const createDetail = (
  overrides: Partial<ScheduleDetail> = {},
): ScheduleDetail => ({
  scheduleId: 'schedule-1',
  spaceId: 'space-1',
  scheduleType: 'PRACTICE' as ScheduleType,
  title: 'QA 합주',
  startAt: '2026-03-19T10:00:00.000Z',
  endAt: '2026-03-19T12:00:00.000Z',
  status: 'PLANNED',
  place: { placeId: 'place-1', name: 'QA 합주실', address: '서울시' },
  songs: [
    {
      songId: 'song-1',
      title: '밤편지',
      artistName: '아이유',
      key: 'A_MINOR',
    },
  ],
  participants: [],
  memo: null,
  externalLinks: [],
  referenceFiles: [],
  createdByBandMemberId: 'member-1',
  isMine: true,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  ...overrides,
});

const renderDetail = (detail: ScheduleDetail) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ScheduleDetailView detail={detail} bandId="band-1" />
    </QueryClientProvider>,
  );
};

describe('ScheduleDetailView', () => {
  it('합주는 곡 제목과 아티스트를 카드로 보여준다', () => {
    renderDetail(createDetail());

    expect(screen.getByText('밤편지')).toBeInTheDocument();
    expect(screen.getByText('아이유')).toBeInTheDocument();
  });

  it('회의는 곡이 실려 있어도 곡 카드를 띄우지 않는다', () => {
    renderDetail(createDetail({ scheduleType: 'MEETING', memo: '안건 정리' }));

    expect(screen.queryByText('밤편지')).not.toBeInTheDocument();
  });

  it('곡 키를 표기 형태로 보여준다', () => {
    renderDetail(createDetail());

    expect(screen.getByText('A Minor')).toBeInTheDocument();
  });

  it('회의 메모(안건)도 상세에 보인다', () => {
    // 메모를 곡 카드 안에 두면 회의에서 통째로 사라진다.
    renderDetail(createDetail({ scheduleType: 'MEETING', memo: '안건 정리' }));

    expect(screen.getByText('안건 정리')).toBeInTheDocument();
  });

  it('합주 메모도 곡과 함께 보인다', () => {
    renderDetail(createDetail({ memo: '인트로 파트 집중' }));

    expect(screen.getByText('밤편지')).toBeInTheDocument();
    expect(screen.getByText('인트로 파트 집중')).toBeInTheDocument();
  });

  it('합주여도 실을 곡이 없으면 빈 카드를 남기지 않는다', () => {
    renderDetail(createDetail({ songs: [], memo: null }));

    expect(document.querySelector('.bg-primary')).toBeNull();
  });

  it('일정 제목은 상단 헤더가 맡으므로 상세 본문에는 넣지 않는다', () => {
    renderDetail(createDetail());

    expect(screen.queryByText('QA 합주')).not.toBeInTheDocument();
  });
});
