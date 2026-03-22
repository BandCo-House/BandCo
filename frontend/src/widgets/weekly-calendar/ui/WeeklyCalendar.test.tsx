/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WeeklyCalendar } from './WeeklyCalendar';
import { getStartOfWeek, getWeekDays } from '@/shared/lib/date';

// 1. TanStack Router Mocking
vi.mock('@tanstack/react-router', () => ({
  useParams: vi.fn().mockReturnValue({ bandId: 'test-band' }),
  useNavigate: vi.fn(),
}));

// 2. Lucide React Mocking (단순 객체 방식으로 변경)
vi.mock('lucide-react', () => ({
  ChevronLeft: (props: any) => <div data-testid="lucide-chevronleft" {...props} />,
  ChevronRight: (props: any) => <div data-testid="lucide-chevronright" {...props} />,
  Plus: (props: any) => <div data-testid="lucide-plus" {...props} />,
  Calendar: (props: any) => <div data-testid="lucide-calendar" {...props} />,
  X: (props: any) => <div data-testid="lucide-x" {...props} />,
}));

// 3. IconMap Mocking
vi.mock('@/constants/icons', () => ({
  IconMap: {
    Calendar: (props: any) => <div data-testid="icon-calendar" {...props} />,
    Add: (props: any) => <div data-testid="icon-add" {...props} />,
  },
}));

// 4. ScheduleCreateModal Mocking (Radix UI Dialog 에러 방지)
vi.mock('@/features/schedule-create/ui/ScheduleCreateModal', () => ({
  ScheduleCreateModal: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div data-testid="schedule-create-modal">Modal Open</div> : null,
}));

// 5. QueryClient 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('WeeklyCalendar (주간 일정표)', () => {
  beforeEach(() => {
    // 2026-03-04 (수요일) 고정
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 4));
    queryClient.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('초기 렌더링 시 현재 주의 월~일 날짜가 표시되어야 합니다', () => {
    renderWithProviders(<WeeklyCalendar />);

    const currentWeekStart = getStartOfWeek(new Date());
    const weekDays = getWeekDays(currentWeekStart);

    const dayLabels = screen.getAllByTestId('day-label');
    expect(dayLabels).toHaveLength(7);

    weekDays.forEach((day, index) => {
      const dateString = day.getDate().toString();
      expect(dayLabels[index]).toHaveTextContent(dateString);
    });
  });

  it('00시부터 23시까지의 시간대 레이블이 모두 렌더링되어야 합니다', () => {
    renderWithProviders(<WeeklyCalendar />);

    // 00:00, 01:00, ..., 23:00 텍스트가 존재하는지 확인
    for (let i = 0; i <= 23; i++) {
      const timeString = `${i.toString().padStart(2, '0')}:00`;
      expect(screen.getByText(timeString)).toBeInTheDocument();
    }
  });

  it('168개의(7일 x 24시간) 일정 슬롯이 존재해야 합니다', () => {
    renderWithProviders(<WeeklyCalendar />);

    const slots = screen.getAllByTestId('time-slot');
    expect(slots).toHaveLength(7 * 24);
  });

  it('이전/다음 버튼 클릭 시 이전 주 또는 다음 주로 날짜가 변경되어야 합니다', () => {
    renderWithProviders(<WeeklyCalendar />);

    const prevButton = screen.getByRole('button', { name: /이전 주/i });
    const nextButton = screen.getByRole('button', { name: /다음 주/i });

    // 초기: 3월 2일(월요일)
    let dayLabels = screen.getAllByTestId('day-label');
    expect(dayLabels[0]).toHaveTextContent('2');
    expect(screen.getByText('2026년 3월 2일 ~ 8일')).toBeInTheDocument();

    // 다음 주 클릭 -> 3월 9일
    fireEvent.click(nextButton);
    dayLabels = screen.getAllByTestId('day-label');
    expect(dayLabels[0]).toHaveTextContent('9');
    expect(screen.getByText('2026년 3월 9일 ~ 15일')).toBeInTheDocument();

    // 이전 주 두 번 클릭 -> 2월 23일
    fireEvent.click(prevButton);
    fireEvent.click(prevButton);
    dayLabels = screen.getAllByTestId('day-label');
    expect(dayLabels[0]).toHaveTextContent('23');
    expect(screen.getByText('2026년 2월 23일 ~ 3월 1일')).toBeInTheDocument();
  });

  it('일정 추가 버튼 클릭 시 모달이 열려야 합니다', () => {
    renderWithProviders(<WeeklyCalendar />);
    
    const addButton = screen.getByRole('button', { name: /일정/i });
    fireEvent.click(addButton);

    expect(screen.getByTestId('schedule-create-modal')).toBeInTheDocument();
  });
});
