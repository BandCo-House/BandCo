import { useState } from 'react';
import type { Profile } from '../model/types';
import { Input } from '@/shared/ui/input';
import { Play, Pause, Check, Edit, CheckIcon, ChevronLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export interface ProfileCardProps {
  profile: Profile;
  isEditing: boolean;
  editForm: {
    nickname: string;
    selfDescription: string;
    profileMusicUrl: string;
  };
  onChangeEditForm: (fields: Partial<ProfileCardProps['editForm']>) => void;
  isMe: boolean;
  isLoggedIn?: boolean;
  onShare: () => void;
  onInvite: () => void;
  onToggleEdit: () => void;
  onSave: () => void;
}

const PillButton = ({
  onClick,
  children,
  className = '',
  disabled = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    className={`relative z-30 flex h-full cursor-pointer items-center justify-center rounded-full border border-grey-50 bg-white/50 px-5 py-4 typo-base-b text-gradient-bottom transition-all duration-300 hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/50 ${className}`}
  >
    {children}
  </Button>
);

export function ProfileCard({
  profile,
  isEditing,
  editForm,
  onChangeEditForm,
  isMe,
  isLoggedIn = false,
  onShare,
  onInvite,
  onToggleEdit,
  onSave,
}: ProfileCardProps) {
  const profileName = profile.profile?.nickname || '익명의 아티스트';
  const avatarUrl = profile.profile?.avatarUrl;
  const selfDescription = profile.profile?.selfDescription;
  const musicUrl = profile.profile?.profileMusicUrl;

  const [isPlaying, setIsPlaying] = useState(false);

  const handleLpClick = () => {
    if (musicUrl) {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative bg-gradient-bottom pb-12">
      <div className="absolute -top-px -left-px z-30 h-1/4 w-full bg-linear-to-b from-black to-black/0" />
      <div className="">
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt="profile-cover"
            className="absolute top-0 left-0 h-[75vh] w-full object-fill object-center blur-[2px] brightness-[0.4] filter"
          />
        )}

        <div className="relative z-50 flex h-[60px] items-center justify-between px-5">
          <h1 className="flex items-center gap-2 typo-lg-b font-semibold text-grey-50">
            {isMe && isEditing && (
              <button
                type="button"
                aria-label="편집 취소"
                onClick={onToggleEdit}
                className="cursor-pointer"
              >
                <ChevronLeft />
              </button>
            )}
            {isMe ? '마이페이지' : `${profileName}님의 프로필`}
          </h1>
          {isMe && (
            <button
              onClick={isEditing ? onSave : onToggleEdit}
              className="flex cursor-pointer items-center gap-1.5 typo-sm-m transition-colors hover:text-white"
            >
              {isEditing ? (
                <>
                  <span className="text-primary">저장</span>
                  <CheckIcon className="size-4 text-primary" />
                </>
              ) : (
                <>
                  <span className="text-grey-300">수정</span>
                  <Edit className="size-4 text-grey-300" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 카드 시작 지점(35vh)부터 이미지 끝(75vh)까지 blur 오버레이 */}
      {/* z-index 없이 DOM 순서상 이미지(z-auto) 위, 카드(z-10) 아래에 위치 */}
      <div className="absolute top-[45vh] left-0 h-[30vh] w-full backdrop-blur-3xl" />

      {/* 2. Glassmorphism Main Content Card Area */}
      <div className="relative z-10 mt-[35vh] rounded-[20px] backdrop-blur-lg">
        <div className="absolute h-full w-full rounded-[20px] bg-white/40" />

        <div className="relative z-20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* 1. Track Music Info Header (Always visible) */}
              <div className="mt-5.5 flex w-full flex-col items-center justify-center gap-1.5 typo-sm-m text-grey-100">
                <div className="flex items-center gap-2">
                  <span>건널목</span>
                  <span>·</span>
                  <span>{musicUrl ? 'Whiteusedsocks' : 'No Music'}</span>
                </div>
              </div>

              {/* 2. Main Profile Content Area (Artist Name & Intro) */}
              <div className="mt-10 mb-18 pr-24 pl-10 text-grey-50">
                {/* Nickname / Artist Name Section */}
                {isEditing ? (
                  <div className="mb-4 flex items-baseline gap-2.5">
                    <label
                      htmlFor="nickname-input"
                      className="shrink-0 cursor-pointer typo-sm-b font-semibold text-grey-50"
                    >
                      닉네임
                    </label>
                    <Input
                      id="nickname-input"
                      value={editForm.nickname}
                      onChange={(e) =>
                        onChangeEditForm({ nickname: e.target.value })
                      }
                      placeholder="닉네임 입력"
                      className="h-auto flex-1 rounded-none border-0 bg-transparent p-0 typo-3xl-b text-white caret-primary shadow-none outline-none focus:ring-0 focus-visible:ring-0"
                    />
                  </div>
                ) : (
                  <h2 className="mb-2 typo-3xl-b leading-tight tracking-tight text-white">
                    {profileName}
                  </h2>
                )}

                {/* Self Description Section */}
                {isEditing ? (
                  <div className="flex items-baseline gap-2.5">
                    <label
                      htmlFor="description-input"
                      className="shrink-0 cursor-pointer typo-sm-b font-semibold text-grey-50"
                    >
                      한 줄 소개
                    </label>
                    <Input
                      id="description-input"
                      value={editForm.selfDescription}
                      onChange={(e) =>
                        onChangeEditForm({ selfDescription: e.target.value })
                      }
                      placeholder="한 줄 소개 입력"
                      className="h-auto flex-1 rounded-none border-0 bg-transparent p-0 typo-base-sb caret-primary shadow-none outline-none focus:ring-0 focus-visible:ring-0"
                    />
                  </div>
                ) : (
                  selfDescription && (
                    <p className="typo-base-sb leading-relaxed">
                      {selfDescription}
                    </p>
                  )
                )}
              </div>
            </div>

            {/* Right: Analog LP Player Disk */}
            <div className="absolute -top-8 right-8 flex shrink-0 flex-col items-center">
              <button
                onClick={handleLpClick}
                disabled={!musicUrl}
                className={`relative flex size-20 items-center justify-center rounded-full border border-slate-800/80 bg-slate-950 shadow-2xl transition-all duration-500 ${
                  musicUrl
                    ? 'cursor-pointer hover:scale-105 active:scale-95'
                    : 'cursor-not-allowed opacity-40'
                } ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}
              >
                {/* LP Disk grooved texture pattern */}
                <div className="absolute inset-1 rounded-full border border-dashed border-slate-800 opacity-60" />
                <div className="absolute inset-3 rounded-full border border-slate-800 opacity-40" />
                <div className="absolute inset-5 rounded-full border border-dashed border-slate-700/60 opacity-30" />

                {/* Center Label Area */}
                <div className="absolute inset-6 flex items-center justify-center rounded-full border border-slate-800 bg-slate-900">
                  <div className="size-2 rounded-full border border-slate-800 bg-slate-950" />
                </div>

                {/* Floating Play Indicator Button */}
                <div className="absolute z-10 flex size-8 items-center justify-center rounded-full border border-white/30 bg-white/20 shadow-md backdrop-blur-sm">
                  {isPlaying ? (
                    <Pause className="size-3.5 fill-white text-white" />
                  ) : (
                    <Play className="size-3.5 translate-x-px fill-white text-white" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="absolute right-6 -bottom-6 left-6 z-20 flex items-center gap-2 overflow-hidden rounded-full bg-[#61759E]/56 px-4 py-2.5 shadow-2xl backdrop-blur-lg transition-all duration-300">
          {isEditing ? (
            <>
              <PillButton onClick={onSave} className="flex-2">
                <Check className="size-4" /> 변경 저장
              </PillButton>
              <PillButton onClick={onToggleEdit} className="flex-1">
                취소
              </PillButton>
            </>
          ) : (
            <>
              <PillButton
                onClick={isMe ? onToggleEdit : onInvite}
                disabled={!isMe && !isLoggedIn}
                className="flex-2"
              >
                {isMe ? '프로필 편집' : '초대하기'}
              </PillButton>
              <PillButton onClick={onShare} className="flex-1">
                공유하기
              </PillButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
