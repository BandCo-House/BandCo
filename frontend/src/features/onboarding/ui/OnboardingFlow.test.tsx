import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingFlow } from './OnboardingFlow';

describe('OnboardingFlow', () => {
  it('초기 단계에서 장르를 선택하면 선택 순서를 표시하고 다음 단계로 이동해야 한다', async () => {
    const user = userEvent.setup();

    render(<OnboardingFlow userName="테스터" onComplete={vi.fn()} />);

    expect(
      screen.getByRole('heading', {
        name: /반가워요, 테스터님\s+어떤 음악을 추구하나요/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '록 (Rock)' }));
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

    render(<OnboardingFlow userName="테스터" onComplete={handleComplete} />);

    await user.click(screen.getByRole('button', { name: '록 (Rock)' }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.click(screen.getByRole('button', { name: '보컬' }));
    await user.click(screen.getByRole('button', { name: '시작하기' }));

    expect(handleComplete).toHaveBeenCalledWith({
      favoriteGenreIds: ['rock'],
      skillTypeIds: ['vocal'],
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
