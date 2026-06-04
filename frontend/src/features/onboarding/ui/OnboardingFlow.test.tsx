import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingFlow } from './OnboardingFlow';

describe('OnboardingFlow', () => {
  const fixtureGenres = [{ id: 'fixture-rock', label: '테스트 록' }];
  const fixtureParts = [{ id: 'fixture-vocal', label: '테스트 보컬' }];

  it('초기 단계에서 장르를 선택하면 선택 순서를 표시하고 다음 단계로 이동해야 한다', async () => {
    const user = userEvent.setup();

    render(
      <OnboardingFlow
        userName="테스터"
        genres={fixtureGenres}
        parts={fixtureParts}
        onComplete={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: /반가워요, 테스터님\s+어떤 음악을 추구하나요/i,
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: fixtureGenres[0].label }),
    );
    expect(screen.getByText('1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(
      screen.getByRole('heading', {
        name: /테스터님이\s+자신 있는 포지션은/i,
      }),
    ).toBeInTheDocument();
  });

  it('파트 선택 단계에서 시작하기를 누르면 완료 콜백을 호출해야 한다', async () => {
    const user = userEvent.setup();
    const handleComplete = vi.fn();

    render(
      <OnboardingFlow
        userName="테스터"
        genres={fixtureGenres}
        parts={fixtureParts}
        onComplete={handleComplete}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: fixtureGenres[0].label }),
    );
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.click(
      screen.getByRole('button', { name: fixtureParts[0].label }),
    );
    await user.click(screen.getByRole('button', { name: '시작하기' }));

    expect(handleComplete).toHaveBeenCalledWith({
      favoriteGenreIds: [fixtureGenres[0].id],
      skillTypeIds: [fixtureParts[0].id],
    });
  });

  it('장르 선택 단계에서 나중에 하기를 누르면 완료 콜백을 호출해야 한다', async () => {
    const user = userEvent.setup();
    const handleComplete = vi.fn();

    render(<OnboardingFlow onComplete={handleComplete} />);

    await user.click(screen.getByRole('button', { name: '나중에 할게요' }));

    expect(handleComplete).toHaveBeenCalledWith({
      favoriteGenreIds: [],
      skillTypeIds: [],
    });
  });
});
