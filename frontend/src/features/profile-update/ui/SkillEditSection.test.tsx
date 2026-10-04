import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SkillEditSection } from './SkillEditSection';
import * as profileApi from '../api/profile-api';
import * as skillApi from '@/entities/skill/api/useSkillTypes';

vi.mock('../api/profile-api', () => ({
  updateUserProfile: vi.fn(),
}));

vi.mock('@/entities/skill/api/useSkillTypes', () => ({
  useSkillTypes: vi.fn(),
}));

describe('SkillEditSection', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(skillApi.useSkillTypes).mockReturnValue({
      data: [
        { id: 'skill-1', name: '일렉기타' },
        { id: 'skill-2', name: '베이스' },
        { id: 'skill-3', name: '드럼' },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof skillApi.useSkillTypes>);

    vi.mocked(profileApi.updateUserProfile).mockResolvedValue(
      {} as Awaited<ReturnType<typeof profileApi.updateUserProfile>>,
    );
  });

  const renderComponent = (props: {
    isMe?: boolean;
    skills?: Array<{
      skillTypeId: string;
      skillName: string;
      level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
      isPrimary: boolean;
    }>;
  }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SkillEditSection
          isMe={props.isMe ?? true}
          userId="user-123"
          skills={
            props.skills ?? [
              {
                skillTypeId: 'skill-1',
                skillName: '일렉기타',
                level: 'ADVANCED',
                isPrimary: true,
              },
            ]
          }
        />
      </QueryClientProvider>,
    );
  };

  it('기존에 등록된 플레이 파트를 렌더링한다', () => {
    renderComponent({});
    expect(screen.getByText('플레이 파트')).toBeInTheDocument();
    expect(screen.getByText('일렉기타')).toBeInTheDocument();
  });

  it('+ 버튼을 클릭하면 바텀시트가 열리고 칩을 토글한 뒤 닫으면 updateUserProfile이 호출된다', async () => {
    const user = userEvent.setup();
    renderComponent({});

    // + 버튼 클릭
    const plusButton = screen.getByRole('button', {
      name: '플레이 파트 수정',
    });
    await user.click(plusButton);

    // 바텀시트 열림 확인
    expect(
      screen.getByRole('heading', { name: '플레이 파트' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /드럼/i })).toBeInTheDocument();

    // 드럼 칩 클릭 (추가)
    await user.click(screen.getByRole('button', { name: /드럼/i }));

    // 닫기 클릭
    const closeButton = screen.getByRole('button', { name: /닫기/i });
    await user.click(closeButton);

    // API 호출 검증
    expect(profileApi.updateUserProfile).toHaveBeenCalledWith('user-123', {
      skills: [
        { skillTypeId: 'skill-1', level: 'ADVANCED', isPrimary: true },
        { skillTypeId: 'skill-3', level: 'BEGINNER', isPrimary: false },
      ],
    });
  });

  // 프로필 조회가 userSkills를 orderBy 없이 돌려줘서 대표가 배열 첫 항목이라는 보장이 없다.
  // 아래 둘은 그 상황(대표가 두 번째)에서 표시와 저장이 모두 isPrimary를 따르는지 본다.
  const unorderedSkills = [
    {
      skillTypeId: 'skill-2',
      skillName: '베이스',
      level: 'BEGINNER' as const,
      isPrimary: false,
    },
    {
      skillTypeId: 'skill-1',
      skillName: '일렉기타',
      level: 'ADVANCED' as const,
      isPrimary: true,
    },
  ];

  it('대표가 배열 첫 항목이 아니어도 핀은 대표 파트에 붙는다', () => {
    renderComponent({ skills: unorderedSkills });

    // 삭제(X)도 svg라 'svg'로 세면 둘 다 걸린다. 핀만 data-slot으로 집는다.
    const pinIn = (label: string) =>
      screen.getByText(label).closest('span')?.querySelector('[data-slot]');

    expect(pinIn('일렉기타')).toBeInTheDocument();
    expect(pinIn('베이스')).not.toBeInTheDocument();
  });

  it('대표가 아닌 파트를 지워도 대표는 그대로 유지된다', async () => {
    const user = userEvent.setup();
    renderComponent({ skills: unorderedSkills });

    await user.click(screen.getByRole('button', { name: '베이스 삭제' }));

    expect(profileApi.updateUserProfile).toHaveBeenCalledWith('user-123', {
      skills: [{ skillTypeId: 'skill-1', level: 'ADVANCED', isPrimary: true }],
    });
  });

  it('삭제(X) 버튼을 누르면 해당 파트가 즉시 삭제된다', async () => {
    const user = userEvent.setup();
    renderComponent({});

    const deleteButton = screen.getByRole('button', {
      name: '일렉기타 삭제',
    });
    await user.click(deleteButton);

    expect(profileApi.updateUserProfile).toHaveBeenCalledWith('user-123', {
      skills: [],
    });
  });
});
