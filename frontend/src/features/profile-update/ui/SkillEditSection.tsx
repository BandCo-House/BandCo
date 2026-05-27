import { useState } from 'react';
import type { Profile } from '@/entities/profile/model/types';
import { Button } from '@/shared/ui/button';
import { Plus, X, Loader2 } from 'lucide-react';
import { useSkillTypes } from '@/entities/skill';
import { updateUserProfile, type SkillLevel } from '../api/profile-api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface SkillEditSectionProps {
  isMe: boolean;
  userId: string;
  skills: Profile['skills'];
}

export function SkillEditSection({
  isMe,
  userId,
  skills,
}: SkillEditSectionProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newSkillId, setNewSkillId] = useState<string | null>(null);
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('BEGINNER');

  // isAdding이 true가 될 때만 Lazy Loading API 트리거
  const skillsQuery = useSkillTypes(isAdding);
  const availableSkills = skillsQuery.data || [];

  // 데이터 로딩 완료 시 첫 번째 항목의 id를 자연스럽게 기본 파생 상태(Derived State 🌟)로 제공
  const selectedSkillId = newSkillId || availableSkills[0]?.id || '';

  const addSkill = async () => {
    const exists = skills.some((s) => s.skillTypeId === selectedSkillId);
    if (exists) {
      toast.warning('이미 등록된 플레이 파트입니다.');
      return;
    }
    const skillObj = availableSkills.find((s) => s.id === selectedSkillId);
    if (!skillObj) return;

    const updatedSkills = [
      ...skills.map((s) => ({
        skillTypeId: s.skillTypeId,
        level: s.level,
        isPrimary: s.isPrimary,
      })),
      { skillTypeId: selectedSkillId, level: newSkillLevel, isPrimary: false },
    ];

    try {
      await updateUserProfile(userId, { skills: updatedSkills });
      queryClient.invalidateQueries({
        queryKey: ['user-profiles', 'detail', userId],
      });
      toast.success('플레이 파트가 추가되었습니다.');
      setNewSkillId(null);
      setIsAdding(false);
    } catch {
      toast.error('파트 추가 도중 에러가 발생했습니다.');
    }
  };

  const removeSkill = async (skillTypeId: string) => {
    const updatedSkills = skills
      .filter((s) => s.skillTypeId !== skillTypeId)
      .map((s) => ({
        skillTypeId: s.skillTypeId,
        level: s.level,
        isPrimary: s.isPrimary,
      }));

    try {
      await updateUserProfile(userId, { skills: updatedSkills });
      queryClient.invalidateQueries({
        queryKey: ['user-profiles', 'detail', userId],
      });
      toast.success('플레이 파트가 삭제되었습니다.');
    } catch {
      toast.error('파트 삭제 도중 에러가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col rounded-3xl border border-grey-500 bg-[#65637A]/48 p-4 text-grey-50 backdrop-blur-xl transition-all duration-300">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="typo-base-b">플레이 파트</h3>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {skills.map((skill) => (
          <span
            key={skill.skillTypeId}
            className="flex items-center rounded-full border border-[#61759E]/56 px-4 py-1.5 typo-base-sb"
          >
            {skill.skillName}
            {isMe && (
              <button
                onClick={() => removeSkill(skill.skillTypeId)}
                className="ml-2 rounded-full text-[#65637A] transition-colors hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            )}
          </span>
        ))}
        {isMe && !isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-[#DCE2F9]/40"
          >
            <Plus className="size-4 text-primary" />
          </Button>
        )}
        {skills.length === 0 && (
          <span className="typo-sm-r text-slate-400">
            등록된 플레이 파트가 없습니다.
          </span>
        )}
      </div>

      {isAdding && isMe && (
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3">
          {skillsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
              <Loader2 className="size-4 animate-spin text-violet-400" />
              <span>악기 파트 목록을 불러오는 중...</span>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <select
                  value={selectedSkillId}
                  onChange={(e) => setNewSkillId(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-900 p-2 typo-sm-r text-slate-200"
                >
                  {availableSkills.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <select
                  value={newSkillLevel}
                  onChange={(e) =>
                    setNewSkillLevel(e.target.value as SkillLevel)
                  }
                  className="rounded-lg border border-slate-800 bg-slate-900 p-2 typo-sm-r text-slate-200"
                >
                  <option value="BEGINNER">초보자</option>
                  <option value="INTERMEDIATE">중급자</option>
                  <option value="ADVANCED">전문가</option>
                </select>
              </div>
              <div className="mt-1 flex gap-2">
                <Button
                  size="sm"
                  onClick={addSkill}
                  className="flex-1 rounded-xl bg-violet-600 text-white hover:bg-violet-500"
                >
                  추가
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewSkillId(null);
                    setIsAdding(false);
                  }}
                  className="rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  취소
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
