import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GenreEditSection } from './GenreEditSection';
import * as profileApi from '../api/profile-api';
import * as genreApi from '@/entities/genre/api/useGenres';

vi.mock('../api/profile-api', () => ({
  updateUserProfile: vi.fn(),
}));

vi.mock('@/entities/genre/api/useGenres', () => ({
  useGenres: vi.fn(),
}));

describe('GenreEditSection', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(genreApi.useGenres).mockReturnValue({
      data: [
        { id: 'genre-1', name: '록/메탈' },
        { id: 'genre-2', name: '팝' },
        { id: 'genre-3', name: '재즈' },
      ],
      isLoading: false,
    } as any);

    vi.mocked(profileApi.updateUserProfile).mockResolvedValue({} as any);
  });

  const renderComponent = (props: {
    isMe?: boolean;
    favoriteGenres?: Array<{
      genreId: string;
      name: string;
    }>;
  }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <GenreEditSection
          isMe={props.isMe ?? true}
          userId="user-123"
          favoriteGenres={
            props.favoriteGenres ?? [
              {
                genreId: 'genre-1',
                name: '록/메탈',
              },
            ]
          }
        />
      </QueryClientProvider>,
    );
  };

  it('기존에 등록된 선호 장르를 렌더링한다', () => {
    renderComponent({});
    expect(screen.getByText('선호 장르')).toBeInTheDocument();
    expect(screen.getByText('록/메탈')).toBeInTheDocument();
  });

  it('+ 버튼을 클릭하면 바텀시트가 열리고 칩을 토글한 뒤 닫으면 updateUserProfile이 호출된다', async () => {
    const user = userEvent.setup();
    renderComponent({});

    // + 버튼 클릭
    const plusButton = screen.getByRole('button', {
      name: '선호 장르 수정',
    });
    await user.click(plusButton);

    // 바텀시트 열림 확인
    expect(
      screen.getByRole('heading', { name: '선호 장르' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /재즈/i }),
    ).toBeInTheDocument();

    // 재즈 칩 클릭 (추가)
    await user.click(screen.getByRole('button', { name: /재즈/i }));

    // 닫기 클릭
    const closeButton = screen.getByRole('button', { name: /닫기/i });
    await user.click(closeButton);

    // API 호출 검증
    expect(profileApi.updateUserProfile).toHaveBeenCalledWith('user-123', {
      favoriteGenres: ['genre-1', 'genre-3'],
    });
  });

  it('삭제(X) 버튼을 누르면 해당 장르가 즉시 삭제된다', async () => {
    const user = userEvent.setup();
    renderComponent({});

    const deleteButton = screen.getByRole('button', {
      name: '록/메탈 삭제',
    });
    await user.click(deleteButton);

    expect(profileApi.updateUserProfile).toHaveBeenCalledWith('user-123', {
      favoriteGenres: [],
    });
  });
});
