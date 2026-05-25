import { createFileRoute } from '@tanstack/react-router';
import { requireLogin } from '@/app/router-guards';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers/auth-context';
import { getUserProfile } from '@/features/profile-get/api/profile-api';
import { updateUserProfile } from '@/features/profile-update/api/profile-api';
import type { Profile } from '@/entities/profile/model/types';
import { getBands } from '@/entities/band/api/band-api';
import type { Band } from '@/entities/band/model/types';
import { createInvite } from '@/features/invite-create/api/invite-api';

// UI Imports
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { GlowBlob } from '@/shared/ui/glow-blob';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

// Icons
import {
  Music,
  Share2,
  UserPlus,
  Plus,
  X,
  Edit2,
  Save,
  ExternalLink,
} from 'lucide-react';
import { z } from 'zod';

const profileSearchSchema = z.object({
  userId: z.string().optional(),
});

export const Route = createFileRoute('/profile')({
  beforeLoad: requireLogin,
  validateSearch: (search) => profileSearchSchema.parse(search),
  component: ProfileRoutePage,
  staticData: {
    header: {
      title: '프로필',
      subtitle: '유저 프로필 정보를 확인하고 관리하세요',
      rightActionLabel: '수정',
      backBehavior: 'browser',
    },
  },
});

// Available instrument and genre options for editing
const AVAILABLE_SKILLS = [
  { id: 'guitar-1', name: '일렉기타' },
  { id: 'acoustic-1', name: '통기타' },
  { id: 'bass-1', name: '베이스' },
  { id: 'drum-1', name: '드럼' },
  { id: 'keyboard-1', name: '키보드' },
  { id: 'vocal-1', name: '보컬' },
];

const AVAILABLE_GENRES = [
  { id: 'genre-rock', name: 'Rock' },
  { id: 'genre-metal', name: 'Metal' },
  { id: 'genre-jazz', name: 'Jazz' },
  { id: 'genre-blues', name: 'Blues' },
  { id: 'genre-pop', name: 'Pop' },
  { id: 'genre-jpop', name: 'J-Pop' },
  { id: 'genre-hiphop', name: 'HipHop' },
];

function ProfileRoutePage() {
  const search = Route.useSearch();
  const auth = useAuth();

  const loggedInUserId = auth.user.id || 'user-001';
  const targetUserId = search.userId || loggedInUserId;
  const isMe = targetUserId === loggedInUserId;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [myBands, setMyBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  // Skill editing form state
  const [newSkillId, setNewSkillId] = useState<string>('guitar-1');
  const [newSkillLevel, setNewSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');

  // Genre editing form state
  const [newGenreId, setNewGenreId] = useState<string>('genre-rock');

  // Invitation state
  const [isInviting, setIsInviting] = useState<boolean>(false);
  const [bandsILoaded, setBandsILoaded] = useState<Band[]>([]);
  const [selectedBandId, setSelectedBandId] = useState<string>('');

  // 1. Fetch Profile and Band data
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile(targetUserId);
      setProfile(data);

      // Load bands the target user belongs to (mock bands list for carousel)
      const bandsData = await getBands();
      // Filter list of bands (for demonstration we just show some bands)
      setMyBands(bandsData.slice(0, 4));

      // Prep edit form
      setEditForm({
        nickname: data.profile?.nickname || '',
        selfDescription: data.profile?.selfDescription || '',
        profileMusicUrl: data.profile?.profileMusicUrl || '',
      });
      setEditSkills(data.skills);
      setEditGenres(data.favoriteGenres);
    } catch (e) {
      toast.error('프로필 데이터를 가져오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [targetUserId]);

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
    if (!editForm.nickname.trim()) {
      toast.warning('닉네임은 필수 입력 항목입니다.');
      return;
    }

    try {
      setLoading(true);
      const updated = await updateUserProfile(targetUserId, {
        profile: {
          nickname: editForm.nickname,
          selfDescription: editForm.selfDescription || null,
          profileMusicUrl: editForm.profileMusicUrl || null,
        },
        skills: editSkills.map((s) => ({
          skillTypeId: s.skillTypeId,
          level: s.level,
          isPrimary: s.isPrimary,
        })),
        favoriteGenres: editGenres.map((g) => g.genreId),
      });

      setProfile(updated);
      setIsEditing(false);
      toast.success('프로필 정보가 저장되었습니다.');
    } catch (e) {
      toast.error('정보 수정 도중 에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Clipboard URL Copy
  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        toast.success('프로필 주소가 클립보드에 성공적으로 복사되었습니다!');
      })
      .catch(() => {
        toast.error('주소 복사에 실패했습니다.');
      });
  };

  // 5. Load Logged-in User's Bands for Invite Modal
  const handleOpenInvite = async () => {
    try {
      const data = await getBands();
      // Only keep bands where the current user is BM (Band Master) or member
      const myBms = data.filter((b) => b.myRole === 'BM');
      setBandsILoaded(myBms.length > 0 ? myBms : data);
      if (myBms.length > 0) {
        setSelectedBandId(myBms[0].id);
      } else if (data.length > 0) {
        setSelectedBandId(data[0].id);
      }
      setIsInviting(true);
    } catch (e) {
      toast.error('밴드 목록을 불러오지 못했습니다.');
    }
  };

  // 6. Complete Invitation
  const handleInviteSubmit = async () => {
    if (!selectedBandId) {
      toast.warning('초대할 밴드를 선택해주세요.');
      return;
    }

    const inviteeEmail = profile?.user.email;
    if (!inviteeEmail) {
      toast.error('대상 유저의 이메일 정보가 누락되어 초대를 보낼 수 없습니다.');
      return;
    }

    try {
      await createInvite(selectedBandId, { inviteeEmail });
      toast.success(`${profile?.profile?.nickname || '유저'}님을 성공적으로 초대했습니다!`);
      setIsInviting(false);
    } catch (e) {
      toast.error('초대 전송 도중 에러가 발생했습니다.');
    }
  };

  // 7. Add/Remove Skill & Genre helper functions
  const addSkill = () => {
    const exists = editSkills.some((s) => s.skillTypeId === newSkillId);
    if (exists) {
      toast.warning('이미 등록된 파트입니다.');
      return;
    }

    const skillObj = AVAILABLE_SKILLS.find((s) => s.id === newSkillId);
    if (!skillObj) return;

    const newSkillItem = {
      skillTypeId: newSkillId,
      skillName: skillObj.name,
      level: newSkillLevel,
      isPrimary: editSkills.length === 0, // Automatically primary if it's the first skill
    };

    setEditSkills([...editSkills, newSkillItem]);
  };

  const removeSkill = (skillTypeId: string) => {
    const updated = editSkills.filter((s) => s.skillTypeId !== skillTypeId);
    // If we removed the primary skill and have skills left, set first as primary
    if (editSkills.find((s) => s.skillTypeId === skillTypeId)?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setEditSkills(updated);
  };

  const addGenre = () => {
    const exists = editGenres.some((g) => g.genreId === newGenreId);
    if (exists) {
      toast.warning('이미 등록된 선호 장르입니다.');
      return;
    }

    const genreObj = AVAILABLE_GENRES.find((g) => g.id === newGenreId);
    if (!genreObj) return;

    setEditGenres([...editGenres, { genreId: newGenreId, name: genreObj.name }]);
  };

  const removeGenre = (genreId: string) => {
    setEditGenres(editGenres.filter((g) => g.genreId !== genreId));
  };

  if (loading && !profile) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <span className="typo-md-m text-violet-400">음악 정보를 조율하고 있습니다...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950 text-slate-200">
        <span className="typo-lg-b text-rose-500">존재하지 않는 유저 프로필입니다.</span>
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
              className="gap-2 border-slate-800 bg-slate-900/60 hover:bg-slate-800"
            >
              <Share2 className="size-4" />
              공유
            </Button>

            {!isMe && auth.user.isLoggedIn && (
              <Button
                variant="default"
                size="sm"
                onClick={handleOpenInvite}
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
                onClick={() => setIsEditing(true)}
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
                  className="border-slate-800 bg-slate-900/40 hover:bg-slate-850"
                >
                  취소
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500"
                >
                  <Save className="size-4" />
                  저장
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 1. Main Profile Card Section */}
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="size-24 border-2 border-violet-500/50 shadow-2xl md:size-28">
                <AvatarImage src={profile.profile?.avatarUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-tr from-violet-800 to-fuchsia-800 text-xl font-bold text-white">
                  {profileName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {profile.user.status === 'ACTIVE' && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 typo-xs-m text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  활동중
                </span>
              )}
            </div>

            {/* Profile Detail Fields */}
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block typo-sm-m text-slate-400">닉네임 (필수)</label>
                    <Input
                      value={editForm.nickname}
                      onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                      placeholder="닉네임을 입력하세요"
                      className="border-slate-800 bg-slate-950/60 focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block typo-sm-m text-slate-400">한 줄 소개</label>
                    <Input
                      value={editForm.selfDescription}
                      onChange={(e) => setEditForm({ ...editForm, selfDescription: e.target.value })}
                      placeholder="자신을 한 줄로 멋지게 설명해보세요"
                      className="border-slate-800 bg-slate-950/60 focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block typo-sm-m text-slate-400">대표 음악 URL</label>
                    <Input
                      value={editForm.profileMusicUrl}
                      onChange={(e) => setEditForm({ ...editForm, profileMusicUrl: e.target.value })}
                      placeholder="유튜브 또는 음원 파일 주소(MP3 등)를 연결하세요"
                      className="border-slate-800 bg-slate-950/60 focus:border-violet-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="typo-2xl-b text-white">{profileName}</h2>
                    <p className="typo-sm-r text-slate-400">{profile.user.email}</p>
                  </div>

                  {profile.profile?.selfDescription ? (
                    <p className="typo-md-r leading-relaxed text-slate-300">
                      "{profile.profile.selfDescription}"
                    </p>
                  ) : (
                    <p className="typo-md-r italic text-slate-500">
                      등록된 한 줄 소개가 없습니다.
                    </p>
                  )}

                  {/* Profile Music Widget */}
                  {profile.profile?.profileMusicUrl && (
                    <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-violet-950/20 p-4 backdrop-blur-md">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                        <Music className="size-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate typo-sm-m text-white">대표 음악 아카이브</p>
                        <a
                          href={profile.profile.profileMusicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 truncate typo-xs-r text-violet-400 hover:underline"
                        >
                          {profile.profile.profileMusicUrl}
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Interactive Instrument & Genre Management Section */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Play Parts (Skills) Card */}
          <div className="flex flex-col rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl">
            <h3 className="mb-4 typo-lg-b text-white">플레이 파트</h3>

            {isEditing ? (
              <div className="space-y-4">
                {/* Current skills with remove button */}
                <div className="flex flex-wrap gap-2">
                  {editSkills.map((skill) => (
                    <span
                      key={skill.skillTypeId}
                      className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 typo-sm-m text-violet-300"
                    >
                      {skill.skillName} • {skill.level}
                      {skill.isPrimary && <span className="typo-xs-b text-violet-400">[주]</span>}
                      <button
                        onClick={() => removeSkill(skill.skillTypeId)}
                        className="rounded-full p-0.5 hover:bg-violet-500/20"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  {editSkills.length === 0 && (
                    <span className="typo-sm-r text-slate-500">아직 선택한 악기 파트가 없습니다.</span>
                  )}
                </div>

                {/* Add new skill selectors */}
                <div className="flex flex-col gap-2 rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                  <div className="flex gap-2">
                    <select
                      value={newSkillId}
                      onChange={(e) => setNewSkillId(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-800 bg-slate-900 p-2 typo-sm-r text-slate-200"
                    >
                      {AVAILABLE_SKILLS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={newSkillLevel}
                      onChange={(e) => setNewSkillLevel(e.target.value as any)}
                      className="rounded-lg border border-slate-800 bg-slate-900 p-2 typo-sm-r text-slate-200"
                    >
                      <option value="BEGINNER">초보자</option>
                      <option value="INTERMEDIATE">중급자</option>
                      <option value="ADVANCED">숙련자</option>
                    </select>
                  </div>
                  <Button
                    size="sm"
                    onClick={addSkill}
                    className="mt-1 w-full bg-violet-600 hover:bg-violet-500 text-white"
                  >
                    <Plus className="size-4 mr-1" /> 파트 추가
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill.skillTypeId}
                    className={`rounded-full px-3 py-1 typo-sm-m border ${
                      skill.isPrimary
                        ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                    }`}
                  >
                    {skill.skillName} •{' '}
                    <span className="font-semibold text-violet-400">
                      {skill.level === 'BEGINNER'
                        ? '초급'
                        : skill.level === 'INTERMEDIATE'
                        ? '중급'
                        : '고급'}
                    </span>
                    {skill.isPrimary && <span className="ml-1 text-xs font-bold text-violet-400">[주]</span>}
                  </span>
                ))}
                {profile.skills.length === 0 && (
                  <span className="typo-sm-r text-slate-500">등록된 플레이 파트가 없습니다.</span>
                )}
              </div>
            )}
          </div>

          {/* Favorite Genres Card */}
          <div className="flex flex-col rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl">
            <h3 className="mb-4 typo-lg-b text-white">선호 장르</h3>

            {isEditing ? (
              <div className="space-y-4">
                {/* Current genres with remove button */}
                <div className="flex flex-wrap gap-2">
                  {editGenres.map((genre) => (
                    <span
                      key={genre.genreId}
                      className="flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 typo-sm-m text-teal-300"
                    >
                      {genre.name}
                      <button
                        onClick={() => removeGenre(genre.genreId)}
                        className="rounded-full p-0.5 hover:bg-teal-500/20"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  {editGenres.length === 0 && (
                    <span className="typo-sm-r text-slate-500">아직 선택한 선호 장르가 없습니다.</span>
                  )}
                </div>

                {/* Add new genre selectors */}
                <div className="flex flex-col gap-2 rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                  <div className="flex gap-2">
                    <select
                      value={newGenreId}
                      onChange={(e) => setNewGenreId(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-800 bg-slate-900 p-2 typo-sm-r text-slate-200"
                    >
                      {AVAILABLE_GENRES.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    size="sm"
                    onClick={addGenre}
                    className="mt-1 w-full bg-teal-650 hover:bg-teal-600 text-white"
                  >
                    <Plus className="size-4 mr-1" /> 장르 추가
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.favoriteGenres.map((genre) => (
                  <span
                    key={genre.genreId}
                    className="rounded-full bg-teal-500/10 border border-teal-500/30 px-3 py-1 typo-sm-m text-teal-300"
                  >
                    {genre.name}
                  </span>
                ))}
                {profile.favoriteGenres.length === 0 && (
                  <span className="typo-sm-r text-slate-500">등록된 선호 장르가 없습니다.</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. My Bands Carousel (Native CSS snap horizontal carousel) */}
        <div className="space-y-4">
          <h3 className="typo-lg-b text-white">소속 밴드 목록</h3>

          <div className="flex w-full snap-x snap-mandatory overflow-x-auto gap-4 scroll-smooth pb-4 scrollbar-thin scrollbar-thumb-slate-800">
            {myBands.map((band) => (
              <div
                key={band.id}
                className="w-[280px] shrink-0 snap-start rounded-2xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/20"
              >
                <div className="mb-4 flex items-center gap-3">
                  <Avatar className="size-11 border border-slate-800">
                    <AvatarFallback className="bg-gradient-to-tr from-indigo-700 to-violet-700 text-sm font-semibold text-white">
                      {band.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <h4 className="truncate typo-md-b text-white">{band.name}</h4>
                    <p className="truncate typo-xs-r text-slate-400">멤버 {band.memberCount}명</p>
                  </div>
                </div>

                <p className="mb-4 h-10 overflow-hidden text-ellipsis line-clamp-2 typo-sm-r text-slate-400">
                  {band.description || '밴드 소개글이 등록되지 않았습니다.'}
                </p>

                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-violet-500/10 px-2 py-0.5 typo-xs-m text-violet-300">
                    {band.myRole === 'BM' ? '마스터' : '멤버'}
                  </span>
                  <span className="typo-xs-r text-slate-500">
                    {new Date(band.joinedAt).toLocaleDateString()} 가입
                  </span>
                </div>
              </div>
            ))}

            {myBands.length === 0 && (
              <div className="flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
                소속된 밴드 목록이 존재하지 않습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Band Invitation Dialog (Invite Modal) */}
      <Dialog open={isInviting} onOpenChange={setIsInviting}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="typo-xl-b text-white flex items-center gap-2">
              <UserPlus className="size-5 text-violet-400" />
              밴드 초대하기
            </DialogTitle>
            <DialogDescription className="typo-sm-r text-slate-400">
              {profileName}님을 회원님이 소속된 밴드로 정중히 초대합니다.
            </DialogDescription>
          </DialogHeader>

          {bandsILoaded.length > 0 ? (
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="typo-sm-m text-slate-300">초대할 내 밴드 선택</label>
                <select
                  value={selectedBandId}
                  onChange={(e) => setSelectedBandId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 typo-sm-r text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  {bandsILoaded.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.myRole === 'BM' ? '마스터' : '멤버'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center typo-sm-r text-slate-500">
              초대할 수 있는 소속 밴드가 없습니다. 밴드를 먼저 생성해보세요!
            </div>
          )}

          <DialogFooter className="gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInviting(false)}
              className="border-slate-800 bg-slate-950 hover:bg-slate-850"
            >
              취소
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleInviteSubmit}
              disabled={bandsILoaded.length === 0}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              초대 전송
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
