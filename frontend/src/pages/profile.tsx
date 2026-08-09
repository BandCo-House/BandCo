import { createFileRoute, redirect } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/auth-context';
import { useUserProfile } from '@/features/profile-get/model/useUserProfile';
import { useMyBands } from '@/entities/band/api/useMyBands';
import {
  updateUserProfile,
  type UpdateProfileRequest,
} from '@/features/profile-update/api/profile-api';
import type { ProfileMusic } from '@/entities/profile/model/types';

// FSD Slices Imports
import { ProfileCard } from '@/entities/profile/ui/ProfileCard';
import { SkillEditSection } from '@/features/profile-update/ui/SkillEditSection';
import { GenreEditSection } from '@/features/profile-update/ui/GenreEditSection';
import { BandInviteModal } from '@/features/band-invite/ui/BandInviteModal';
import { UserBandsCarousel } from '@/widgets/band-list/ui/UserBandsCarousel';
import { profileEditSchema } from '@/features/profile-update/model/schema';
import { compressProfileImage } from '@/features/profile-update/model/image-compression';
import { ProfileMusicSearchDialog } from '@/features/profile-update/ui/ProfileMusicSearchDialog';
import {
  AppDialogBody,
  AppDialogContent,
  AppDialogFooter,
  Dialog,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';

// UI Imports

import { toast } from 'sonner';

// Icons

import { z } from 'zod';

type ProfileSearch = {
  userId?: string;
};

const profileSearchSchema = z.object({
  userId: z.string().optional(),
});

const validateProfileSearch = (
  search: Record<string, unknown>,
): ProfileSearch => profileSearchSchema.parse(search);

export const Route = createFileRoute('/profile')({
  validateSearch: validateProfileSearch,

  beforeLoad: ({ context, search }) => {
    // 로그인된 상태인데 유저 ID 파싱에 실패한 모순 상태 (비정상 토큰) 정리 먼저 수행
    if (context.user.isLoggedIn && !context.user.id) {
      context.logout(); // 전역 로그아웃을 트리거하여 스토리지 비우기 + 리액트 상태 변경 동시 완료
      throw redirect({ to: '/login' }); // 안전하게 SPA 리다이렉트
    }

    const { userId } = search;
    // userId 키가 존재하면 방문자모드로 허용 (빈 문자열이여도 서버 유효성 검사로 위임)
    if (userId !== undefined) return;

    // 일반 비로그인 상태
    if (!context.user.isLoggedIn) {
      throw redirect({ to: '/login' });
    }
  },
  component: ProfileRoutePage,
});

function ProfileRoutePage() {
  const search = Route.useSearch();
  const auth = useAuth();

  const loggedInUserId = auth.user.isLoggedIn ? auth.user.id : null;
  const targetUserId =
    search.userId !== undefined ? search.userId : loggedInUserId || '';
  const isMe = !!loggedInUserId && targetUserId === loggedInUserId;

  const queryClient = useQueryClient();

  const { data: profileData, isLoading: isProfileLoading } =
    useUserProfile(targetUserId);
  const { data: bandsData, isLoading: isBandsLoading } = useMyBands(isMe);

  const loading = isProfileLoading || isBandsLoading;
  const profile = profileData || null;
  const myBands = bandsData ? bandsData.slice(0, 4) : [];

  // Editing state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<{
    nickname: string;
    selfDescription: string;
    profileMusic: ProfileMusic | null;
    avatarUrl: string;
  }>({
    nickname: '',
    selfDescription: '',
    profileMusic: null,
    avatarUrl: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isMusicSearchOpen, setIsMusicSearchOpen] = useState(false);
  const [isLeaveEditDialogOpen, setIsLeaveEditDialogOpen] = useState(false);
  const avatarPreviewUrlRef = useRef<string | null>(null);

  // Invitation state
  const [isInviting, setIsInviting] = useState<boolean>(false);

  // 2. BeforeUnload Listener for unsaved edits
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing) {
        e.preventDefault();
        e.returnValue = '변경 사항이 저장되지 않을 수 있습니다.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEditing]);

  const revokeAvatarPreviewUrl = () => {
    if (!avatarPreviewUrlRef.current) return;

    URL.revokeObjectURL(avatarPreviewUrlRef.current);
    avatarPreviewUrlRef.current = null;
  };

  useEffect(() => {
    return () => {
      revokeAvatarPreviewUrl();
    };
  }, []);

  // 3. Save profile changes
  const handleSave = async () => {
    const result = profileEditSchema.safeParse(editForm);

    if (!result.success) {
      const errorMessages = result.error.issues
        .map((issue) => issue.message)
        .join('\n');
      toast.warning(errorMessages || '입력값이 올바르지 않습니다.');
      return;
    }

    const validatedData = result.data;

    try {
      const profilePayload: NonNullable<UpdateProfileRequest['profile']> = {
        nickname: validatedData.nickname,
        selfDescription: validatedData.selfDescription || null,
        profileMusic: validatedData.profileMusic,
      };

      if (avatarFile) {
        const formData = new FormData();
        formData.append(
          'profile',
          new Blob([JSON.stringify(profilePayload)], {
            type: 'application/json',
          }),
        );
        formData.append('avatar', avatarFile);
        await updateUserProfile(targetUserId, formData);
      } else {
        profilePayload.avatarUrl = validatedData.avatarUrl || null;
        await updateUserProfile(targetUserId, {
          profile: profilePayload,
        });
      }

      queryClient.invalidateQueries({
        queryKey: ['user-profiles', 'detail', targetUserId],
      });
      setIsEditing(false);
      setAvatarFile(null);
      setEditForm((prev) => ({ ...prev, avatarUrl: '' }));
      revokeAvatarPreviewUrl();
      toast.success('프로필 정보가 저장되었습니다.');
    } catch (error) {
      console.error(error);
      toast.error('정보 수정 도중 에러가 발생했습니다.');
    }
  };

  // 4. Clipboard URL Copy — 항상 ?userId 포함 URL 복사
  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('userId', targetUserId);
    navigator.clipboard
      .writeText(url.toString())
      .then(() => {
        toast.success('주소가 클립보드에 저장되었습니다.');
      })
      .catch(() => {
        toast.error('주소 복사에 실패했습니다.');
      });
  };

  const resetEditForm = () => {
    revokeAvatarPreviewUrl();
    setEditForm({
      nickname: profile?.profile?.nickname || '',
      selfDescription: profile?.profile?.selfDescription || '',
      profileMusic: profile?.profile?.profileMusic ?? null,
      avatarUrl: profile?.profile?.avatarUrl || '',
    });
    setAvatarFile(null);
  };

  const enterEditMode = () => {
    resetEditForm();
    setIsEditing(true);
  };

  const requestExitEditMode = () => {
    if (!isEditing) {
      enterEditMode();
      return;
    }

    setIsLeaveEditDialogOpen(true);
  };

  const discardEditChanges = () => {
    resetEditForm();
    setIsEditing(false);
    setIsLeaveEditDialogOpen(false);
  };

  if (loading && !profile) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <span className="typo-md-m text-violet-400">
            프로필 정보를 불러오는 중입니다.
          </span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950 text-slate-200">
        <span className="typo-lg-b text-rose-500">
          존재하지 않는 유저 프로필입니다.
        </span>
      </div>
    );
  }

  const profileName = profile.profile?.nickname || '익명의 아티스트';

  return (
    <div className="relative -mx-5 -my-8 min-h-screen">
      {/* Background Neon Blob Decoration */}

      <div className="relative z-10">
        {/* 1. Main Profile Card Section (entities/profile) */}
        <ProfileCard
          profile={profile}
          isEditing={isEditing}
          editForm={editForm}
          onChangeEditForm={(fields) =>
            setEditForm((prev) => ({ ...prev, ...fields }))
          }
          isMe={isMe}
          isLoggedIn={auth.user.isLoggedIn}
          onShare={handleShare}
          onInvite={() => setIsInviting(true)}
          onToggleEdit={requestExitEditMode}
          onSave={handleSave}
          onAvatarFileSelect={(file) => {
            void compressProfileImage(file)
              .then(({ file: compressedFile, previewUrl }) => {
                revokeAvatarPreviewUrl();
                avatarPreviewUrlRef.current = previewUrl;
                setAvatarFile(compressedFile);
                setEditForm((prev) => ({ ...prev, avatarUrl: previewUrl }));
              })
              .catch((error) => {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : '이미지 처리 도중 에러가 발생했습니다.',
                );
              });
          }}
          onOpenMusicSearch={() => setIsMusicSearchOpen(true)}
        />
        <div className="bg-gradient-top pb-6">
          <div className="flex flex-col gap-2 px-5">
            {/* 2. Play Parts & Favorite Genres Section (features/profile-update) */}

            <SkillEditSection
              isMe={isMe}
              userId={targetUserId}
              skills={profile.skills || []}
            />
            <GenreEditSection
              isMe={isMe}
              userId={targetUserId}
              favoriteGenres={profile.favoriteGenres || []}
            />

            {/* 3. My Bands List Section (widgets/band-list) */}
            {isMe && <UserBandsCarousel bands={myBands} />}
          </div>
        </div>

        {/* 4. Band Invitation Dialog (features/band-invite) */}

        {!isMe && auth.user.isLoggedIn && (
          <BandInviteModal
            open={isInviting}
            onOpenChange={setIsInviting}
            inviteeName={profileName}
            inviteeEmail={profile.user.email}
            isLoggedIn={auth.user.isLoggedIn}
          />
        )}
        <ProfileMusicSearchDialog
          open={isMusicSearchOpen}
          onOpenChange={setIsMusicSearchOpen}
          onSelect={(song) => {
            setEditForm((prev) => ({
              ...prev,
              profileMusic: song,
            }));
          }}
        />
        <Dialog
          open={isLeaveEditDialogOpen}
          onOpenChange={setIsLeaveEditDialogOpen}
        >
          <AppDialogContent className="max-w-[calc(100%-2rem)] p-8 sm:max-w-2xl">
            <AppDialogBody className="items-center gap-6 text-center">
              <DialogTitle className="text-3xl text-grey-50">
                편집 모드를 나가시겠습니까?
              </DialogTitle>
              <p className="typo-lg-sb text-grey-100">
                변경사항이 저장되지 않습니다
              </p>
            </AppDialogBody>
            <AppDialogFooter className="mt-8 flex-row gap-4">
              <Button
                type="button"
                variant="neutral"
                size="lg"
                width="flex"
                onClick={() => setIsLeaveEditDialogOpen(false)}
                className="text-grey-50"
              >
                취소
              </Button>
              <Button
                type="button"
                variant="shining"
                size="lg"
                width="flex"
                onClick={discardEditChanges}
              >
                나가기
              </Button>
            </AppDialogFooter>
          </AppDialogContent>
        </Dialog>
      </div>
    </div>
  );
}
