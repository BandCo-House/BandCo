import { createFileRoute, redirect } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/auth-context';
import { useUserProfile } from '@/features/profile-get/model/useUserProfile';
import { useMyBands } from '@/entities/band/api/useMyBands';
import { updateUserProfile } from '@/features/profile-update/api/profile-api';
import type { Profile } from '@/entities/profile/model/types';

// FSD Slices Imports
import { ProfileCard } from '@/entities/profile/ui/ProfileCard';
import { SkillGenreEditSection } from '@/features/profile-update/ui/SkillGenreEditSection';
import { BandInviteModal } from '@/features/band-invite/ui/BandInviteModal';
import { UserBandsCarousel } from '@/widgets/band-list/ui/UserBandsCarousel';
import { profileEditSchema } from '@/features/profile-update/model/schema';

// UI Imports
import { Button } from '@/shared/ui/button';
import { GlowBlob } from '@/shared/ui/glow-blob';
import { toast } from 'sonner';

// Icons
import { Share2, UserPlus, Edit2 } from 'lucide-react';
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
    const { userId } = search;
    // userId 있으면 방문자모드 (비로그인도 허용)
    if (userId) return;

    // 로그인된 상태인데 유저 ID 파싱에 실패한 모순 상태 (비정상 토큰)
    if (context.user.isLoggedIn && !context.user.id) {
      context.logout(); // 전역 로그아웃을 트리거하여 스토리지 비우기 + 리액트 상태 변경 동시 완료
      throw redirect({ to: '/login' }); // 안전하게 SPA 리다이렉트
    }

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
  const targetUserId = search.userId || loggedInUserId || '';
  const isMe = !!loggedInUserId && targetUserId === loggedInUserId;

  const queryClient = useQueryClient();

  const { data: profileData, isLoading: isProfileLoading } =
    useUserProfile(targetUserId);
  const { data: bandsData, isLoading: isBandsLoading } = useMyBands();

  const loading = isProfileLoading || isBandsLoading;
  const profile = profileData || null;
  const myBands = bandsData ? bandsData.slice(0, 4) : [];

  // Editing state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<{
    nickname: string;
    selfDescription: string;
    profileMusicUrl: string;
  }>({
    nickname: '',
    selfDescription: '',
    profileMusicUrl: '',
  });

  const [editSkills, setEditSkills] = useState<Profile['skills']>([]);
  const [editGenres, setEditGenres] = useState<Profile['favoriteGenres']>([]);

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
      await updateUserProfile(targetUserId, {
        profile: {
          nickname: validatedData.nickname,
          selfDescription: validatedData.selfDescription || null,
          profileMusicUrl: validatedData.profileMusicUrl || null,
        },
        skills: editSkills.map((s) => ({
          skillTypeId: s.skillTypeId,
          level: s.level,
          isPrimary: s.isPrimary,
        })),
        favoriteGenres: editGenres.map((g) => g.genreId),
      });

      queryClient.invalidateQueries({
        queryKey: ['user-profiles', 'detail', targetUserId],
      });
      setIsEditing(false);
      toast.success('프로필 정보가 저장되었습니다.');
    } catch {
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
        toast.success('프로필 주소가 클립보드에 성공적으로 복사되었습니다!');
      })
      .catch(() => {
        toast.error('주소 복사에 실패했습니다.');
      });
  };

  if (loading && !profile) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <span className="typo-md-m text-violet-400">
            음악 정보를 조율하고 있습니다...
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
    <div className="relative min-h-[90vh] overflow-hidden bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      {/* Background Neon Blob Decoration */}
      <div className="absolute inset-0 z-0 h-full opacity-60">
        <GlowBlob className="text-violet-500" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl space-y-8">
        {/* Page Title & Main Header */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="typo-3xl-b tracking-tight text-white">
              {isMe ? '마이페이지' : `${profileName}님의 프로필`}
            </h1>
            <p className="typo-sm-r text-slate-400">
              {isMe
                ? '내 잼 연주 정보와 프로필을 편리하게 편집하세요.'
                : '아티스트의 악기 파트, 선호 장르 및 소속 밴드를 확인하세요.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="hover:bg-slate-880 gap-2 border-slate-800 bg-slate-900/60"
            >
              <Share2 className="size-4" />
              공유
            </Button>

            {!isMe && auth.user.isLoggedIn && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsInviting(true)}
                className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:from-violet-500 hover:to-indigo-500"
              >
                <UserPlus className="size-4" />
                초대하기
              </Button>
            )}

            {isMe && !isEditing && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (profile) {
                    setEditForm({
                      nickname: profile.profile?.nickname || '',
                      selfDescription: profile.profile?.selfDescription || '',
                      profileMusicUrl: profile.profile?.profileMusicUrl || '',
                    });
                    setEditSkills(profile.skills || []);
                    setEditGenres(profile.favoriteGenres || []);
                  }
                  setIsEditing(true);
                }}
                className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:from-violet-500 hover:to-indigo-500"
              >
                <Edit2 className="size-4" />
                수정하기
              </Button>
            )}

            {isMe && isEditing && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset to original values
                    setEditForm({
                      nickname: profile.profile?.nickname || '',
                      selfDescription: profile.profile?.selfDescription || '',
                      profileMusicUrl: profile.profile?.profileMusicUrl || '',
                    });
                    setEditSkills(profile.skills);
                    setEditGenres(profile.favoriteGenres);
                  }}
                  className="hover:bg-slate-850 border-slate-800 bg-slate-900/40"
                >
                  취소
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500"
                >
                  저장
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 1. Main Profile Card Section (entities/profile) */}
        <ProfileCard
          profile={profile}
          isEditing={isEditing}
          editForm={editForm}
          onChangeEditForm={(fields) =>
            setEditForm((prev) => ({ ...prev, ...fields }))
          }
        />

        {/* 2. Play Parts & Favorite Genres Section (features/profile-update) */}
        <SkillGenreEditSection
          isEditing={isEditing}
          skills={profile.skills}
          favoriteGenres={profile.favoriteGenres}
          editSkills={editSkills}
          editGenres={editGenres}
          onSetEditSkills={setEditSkills}
          onSetEditGenres={setEditGenres}
        />

        {/* 3. My Bands List Section (widgets/band-list) */}
        <UserBandsCarousel bands={myBands} />
      </div>

      {/* 4. Band Invitation Dialog (features/band-invite) */}
      <BandInviteModal
        open={isInviting}
        onOpenChange={setIsInviting}
        inviteeName={profileName}
        inviteeEmail={profile.user.email}
      />
    </div>
  );
}
