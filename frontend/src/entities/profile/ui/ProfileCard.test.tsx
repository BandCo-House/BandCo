import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Profile } from '../model/types';
import { ProfileCard, type ProfileCardProps } from './ProfileCard';

const PROFILE: Profile = {
  user: {
    id: 'user-002',
    email: null,
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  profile: {
    nickname: '베이시스트',
    selfDescription: null,
    profileMusic: null,
    avatarUrl: null,
  },
  skills: [],
  favoriteGenres: [],
};

const renderCard = (props: Partial<ProfileCardProps>) =>
  render(
    <ProfileCard
      profile={PROFILE}
      isEditing={false}
      editForm={{
        nickname: '',
        selfDescription: '',
        profileMusic: null,
        avatarUrl: '',
      }}
      onChangeEditForm={vi.fn()}
      isMe={false}
      isLoggedIn
      onShare={vi.fn()}
      onInvite={vi.fn()}
      onReport={vi.fn()}
      onToggleEdit={vi.fn()}
      onSave={vi.fn()}
      onAvatarFileSelect={vi.fn()}
      onOpenMusicSearch={vi.fn()}
      {...props}
    />,
  );

describe('ProfileCard 신고 진입점', () => {
  it('로그인한 사용자가 다른 유저 프로필을 보면 신고 버튼을 누를 수 있다', async () => {
    const user = userEvent.setup();
    const onReport = vi.fn();
    renderCard({ onReport });

    await user.click(screen.getByRole('button', { name: '신고하기' }));

    expect(onReport).toHaveBeenCalledTimes(1);
  });

  it('내 프로필에서는 신고 버튼이 없다', () => {
    renderCard({ isMe: true });

    expect(
      screen.queryByRole('button', { name: '신고하기' }),
    ).not.toBeInTheDocument();
  });

  it('로그인하지 않았으면 신고 버튼이 없다', () => {
    renderCard({ isLoggedIn: false });

    expect(
      screen.queryByRole('button', { name: '신고하기' }),
    ).not.toBeInTheDocument();
  });
});
