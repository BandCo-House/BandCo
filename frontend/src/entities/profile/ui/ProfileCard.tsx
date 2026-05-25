import type { Profile } from '../model/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Input } from '@/shared/ui/input';
import { ProfileMusicWidget } from './ProfileMusicWidget';

export interface ProfileCardProps {
  profile: Profile;
  isEditing: boolean;
  editForm: {
    nickname: string;
    selfDescription: string;
    profileMusicUrl: string;
  };
  onChangeEditForm: (fields: Partial<ProfileCardProps['editForm']>) => void;
}

export function ProfileCard({ profile, isEditing, editForm, onChangeEditForm }: ProfileCardProps) {
  const profileName = profile.profile?.nickname || '익명의 아티스트';

  return (
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
                  onChange={(e) => onChangeEditForm({ nickname: e.target.value })}
                  placeholder="닉네임을 입력하세요"
                  className="border-slate-800 bg-slate-950/60 focus:border-violet-500"
                />
              </div>

              <div>
                <label className="mb-1 block typo-sm-m text-slate-400">한 줄 소개</label>
                <Input
                  value={editForm.selfDescription}
                  onChange={(e) => onChangeEditForm({ selfDescription: e.target.value })}
                  placeholder="자신을 한 줄로 멋지게 설명해보세요"
                  className="border-slate-800 bg-slate-950/60 focus:border-violet-500"
                />
              </div>

              <div>
                <label className="mb-1 block typo-sm-m text-slate-400">대표 음악 URL</label>
                <Input
                  value={editForm.profileMusicUrl}
                  onChange={(e) => onChangeEditForm({ profileMusicUrl: e.target.value })}
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

              {profile.profile?.profileMusicUrl && (
                <ProfileMusicWidget musicUrl={profile.profile.profileMusicUrl} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
