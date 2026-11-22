import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Profile } from '../model/types';
import { ProfileCard, type ProfileCardProps } from './ProfileCard';

const buildProfile = (handle: string | null): Profile => ({
  user: {
    id: 'user-001',
    email: null,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  profile: {
    nickname: '김민준',
    handle,
    handleChangeableAt: null,
    selfDescription: null,
    profileMusic: null,
    avatarUrl: null,
  },
  skills: [],
  favoriteGenres: [],
});

const renderCard = (overrides: Partial<ProfileCardProps>) =>
  render(
    <ProfileCard
      profile={buildProfile(null)}
      isEditing={false}
      editForm={{
        nickname: '',
        selfDescription: '',
        profileMusic: null,
        avatarUrl: '',
      }}
      onChangeEditForm={vi.fn()}
      isMe
      onShare={vi.fn()}
      onInvite={vi.fn()}
      onToggleEdit={vi.fn()}
      onSave={vi.fn()}
      onAvatarFileSelect={vi.fn()}
      onOpenMusicSearch={vi.fn()}
      {...overrides}
    />,
  );

describe('ProfileCard 고유 ID', () => {
  it('고유 ID가 있으면 이름 아래 @ID로 보여준다', () => {
    renderCard({ profile: buildProfile('minsu_k'), isMe: false });

    expect(screen.getByText('@minsu_k')).toBeInTheDocument();
  });

  it('본인인데 고유 ID가 없으면 바로 정하러 가는 버튼을 준다', async () => {
    const onStartHandleSetup = vi.fn();
    renderCard({ onStartHandleSetup });

    await userEvent.click(
      screen.getByRole('button', { name: '고유 ID 정하기' }),
    );

    expect(onStartHandleSetup).toHaveBeenCalledOnce();
  });

  it('다른 사람의 프로필에서는 ID가 없어도 정하기 버튼을 보이지 않는다', () => {
    renderCard({ isMe: false, onStartHandleSetup: vi.fn() });

    expect(
      screen.queryByRole('button', { name: '고유 ID 정하기' }),
    ).not.toBeInTheDocument();
  });
});
