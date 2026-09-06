import { useRef } from 'react';
import type { Profile, ProfileMusic } from '../model/types';
import { Input } from '@/shared/ui/input';
import { Play, Pause, Edit, CheckIcon, ChevronLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { GlassRim } from '@/shared/ui/glass-rim';
import GalleryIcon from '@/assets/icons/gallery.svg?react';
import { useAudioPreview } from '@/shared/lib/use-audio-preview';

export interface ProfileCardProps {
  profile: Profile;
  isEditing: boolean;
  editForm: {
    nickname: string;
    selfDescription: string;
    profileMusic: ProfileMusic | null;
    avatarUrl: string;
  };
  onChangeEditForm: (fields: Partial<ProfileCardProps['editForm']>) => void;
  isMe: boolean;
  isLoggedIn?: boolean;
  onShare: () => void;
  onInvite: () => void;
  onToggleEdit: () => void;
  onSave: () => void;
  onAvatarFileSelect: (file: File) => void;
  onOpenMusicSearch: () => void;
}

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
  onAvatarFileSelect,
  onOpenMusicSearch,
}: ProfileCardProps) {
  const profileName = profile.profile?.nickname || '익명의 아티스트';
  const avatarUrl = editForm.avatarUrl || profile.profile?.avatarUrl;
  const selfDescription = profile.profile?.selfDescription;
  const profileMusic = isEditing
    ? editForm.profileMusic
    : profile.profile?.profileMusic;
  const musicUrl = profileMusic?.previewUrl ?? null;
  const profileMusicTitle = profileMusic?.title ?? '음악 없음';
  const profileMusicArtist = profileMusic?.artistName ?? '';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isPlaying,
    canPlay: canPlayProfileMusic,
    toggle: togglePreview,
    audioRef,
    audioEventProps,
  } = useAudioPreview(musicUrl, {
    errorMessage: '프로필 음악을 재생할 수 없습니다.',
  });

  const handleLpClick = () => {
    if (isEditing) {
      onOpenMusicSearch();
      return;
    }
    togglePreview();
  };

  return (
    <div className="relative isolate bg-gradient-top pb-12">
      {avatarUrl && (
        <div className="absolute top-0 left-0 z-0 h-full w-full overflow-hidden">
          <img
            src={avatarUrl}
            alt="profile-cover"
            className="h-full w-full object-cover object-center brightness-[0.72] filter"
          />
        </div>
      )}
      <div className="absolute top-0 left-0 z-10 h-full w-full bg-linear-to-b from-[#020119] via-[#020119]/10 via-45% to-[#020119]" />

      <div className="relative z-50 flex min-h-9 w-full items-center justify-between px-5 py-3">
        <h1 className="flex min-h-9 items-center gap-2 typo-lg-b font-semibold text-grey-50">
          {isMe && isEditing && (
            <button
              type="button"
              aria-label="편집 취소"
              onClick={onToggleEdit}
              className="flex size-9 cursor-pointer items-center justify-center"
            >
              <ChevronLeft />
            </button>
          )}
          {!isMe
            ? `${profileName}님의 프로필`
            : isEditing
              ? '프로필 편집'
              : '마이페이지'}
        </h1>
        {isMe && (
          <button
            onClick={isEditing ? onSave : onToggleEdit}
            className="flex min-h-9 cursor-pointer items-center justify-center gap-2.5 px-3 py-2 typo-sm-m transition-colors hover:text-white"
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

      {isEditing && (
        <>
          <button
            type="button"
            aria-label="프로필 배경 이미지 변경"
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-[285px] left-5 z-30 flex size-9 cursor-pointer items-center justify-center rounded-full bg-surface-1 p-2.5 text-primary shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-95"
          >
            <GalleryIcon className="size-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onAvatarFileSelect(file);
              event.target.value = '';
            }}
          />
        </>
      )}

      <div className="relative z-20 mt-72 mb-12 rounded-md backdrop-blur-lg">
        <div className="absolute h-full w-full rounded-md bg-white/40 backdrop-blur-lg" />
        <GlassRim />

        <div className="relative z-20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <button
                type="button"
                onClick={isEditing ? onOpenMusicSearch : undefined}
                className="mt-5.5 mr-34 ml-auto flex max-w-52 items-center justify-end gap-1.5 typo-sm-m text-grey-100"
              >
                <span className="truncate">{profileMusicTitle}</span>
                {profileMusicArtist && (
                  <>
                    <span>·</span>
                    <span className="truncate text-right">
                      {profileMusicArtist}
                    </span>
                  </>
                )}
              </button>

              <div className="mx-auto mt-10 mb-20 grid w-full max-w-65 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2 text-grey-50">
                {isEditing ? (
                  <>
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
                      className="w-full rounded-none border-0 bg-transparent p-0 typo-3xl-b text-white caret-primary shadow-none outline-none focus:ring-0 focus-visible:ring-0"
                    />
                  </>
                ) : (
                  <h2 className="col-span-2 typo-3xl-b leading-tight tracking-tight text-white">
                    {profileName}
                  </h2>
                )}

                {isEditing ? (
                  <>
                    <label
                      htmlFor="description-input"
                      className="shrink-0 cursor-pointer typo-sm-b font-semibold text-grey-50"
                    >
                      소개
                    </label>
                    <Input
                      id="description-input"
                      value={editForm.selfDescription}
                      onChange={(e) =>
                        onChangeEditForm({ selfDescription: e.target.value })
                      }
                      placeholder="한 줄 소개 입력"
                      className="w-full rounded-none border-0 bg-transparent p-0 typo-base-sb caret-primary shadow-none outline-none focus:ring-0 focus-visible:ring-0"
                    />
                  </>
                ) : (
                  <p className="col-span-2 typo-base-sb leading-relaxed">
                    {selfDescription}
                  </p>
                )}
              </div>
            </div>

            <div className="absolute -top-16 right-8 flex shrink-0 flex-col items-center">
              <audio
                ref={audioRef}
                src={musicUrl || undefined}
                preload="none"
                {...audioEventProps}
              />
              <button
                onClick={handleLpClick}
                disabled={!isEditing && !canPlayProfileMusic}
                aria-label={
                  isEditing
                    ? '프로필 음악 수정'
                    : isPlaying
                      ? '프로필 음악 일시정지'
                      : '프로필 음악 재생'
                }
                className={`relative flex size-25 items-center justify-center gap-2.5 rounded-full bg-grey-400 p-0 shadow-lg ${
                  isEditing || canPlayProfileMusic
                    ? 'cursor-pointer'
                    : 'cursor-not-allowed opacity-40'
                } ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}
              >
                {isEditing ? (
                  <span className="relative z-10 flex size-12 items-center justify-center rounded-full bg-primary text-primary-dark">
                    <Edit className="size-5" />
                  </span>
                ) : isPlaying ? (
                  <Pause className="relative z-10 size-10 fill-white text-white" />
                ) : (
                  <Play className="translate-x-0.4 relative z-10 size-10 fill-white text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="absolute right-5 -bottom-7 left-5 z-20 mx-auto max-w-sm rounded-full p-0.5">
          <div className="absolute inset-0 rounded-full bg-surface-2 backdrop-blur-sm" />
          <div className="relative flex items-start gap-2 rounded-full px-4 py-2.5">
            <Button
              variant="neutral"
              size="pill"
              width="flex"
              onClick={onInvite}
              disabled={isMe || !isLoggedIn}
              className="active:animate-[button-pop_180ms_ease-out]"
            >
              초대하기
            </Button>
            <Button
              variant="neutral"
              size="pill"
              width="fit"
              onClick={onShare}
              disabled={isMe && isEditing}
              className="active:animate-[button-pop_180ms_ease-out]"
            >
              공유하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
