import { useState, useRef } from 'react';
import type { Profile } from '@/entities/profile/model/types';
import { Button } from '@/shared/ui/button';
import { Plus, X } from 'lucide-react';
import { useSkillTypes } from '@/entities/skill';
import { updateUserProfile } from '../api/profile-api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TagSelectBottomSheet } from './TagSelectBottomSheet';

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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isUpdatingRef = useRef(false);

  // 시트가 열릴 때만 Lazy Loading으로 전체 악기 파트 목록 로드
  const skillsQuery = useSkillTypes(isSheetOpen);
  const availableSkills = skillsQuery.data || [];

  const handleSaveSkills = async (newSkillIds: string[]) => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    setIsUpdating(true);

    const queryKey = ['user-profiles', 'detail', userId];
    await queryClient.cancelQueries({ queryKey });
    const previousProfile = queryClient.getQueryData<Profile>(queryKey);

    const updatedSkills = newSkillIds.map((id, index) => {
      const existing = skills.find((s) => s.skillTypeId === id);
      return {
        skillTypeId: id,
        level: existing?.level ?? 'BEGINNER',
        isPrimary: index === 0,
      };
    });

    // 낙관적 업데이트: 화면에 즉시 반영
    if (previousProfile) {
      const optimisticSkills = newSkillIds.map((id, index) => {
        const existing = skills.find((s) => s.skillTypeId === id);
        const meta = availableSkills.find((item) => item.id === id);
        return {
          skillTypeId: id,
          skillName: meta?.name ?? existing?.skillName ?? '',
          level: existing?.level ?? 'BEGINNER',
          isPrimary: index === 0,
        };
      });

      queryClient.setQueryData<Profile>(queryKey, {
        ...previousProfile,
        skills: optimisticSkills,
      });
    }

    try {
      await updateUserProfile(userId, { skills: updatedSkills });
      toast.success('플레이 파트가 저장되었습니다.');
    } catch {
      if (previousProfile) {
        queryClient.setQueryData(queryKey, previousProfile);
      }
      toast.error('파트 저장 도중 에러가 발생했습니다.');
    } finally {
      isUpdatingRef.current = false;
      setIsUpdating(false);
      queryClient.invalidateQueries({ queryKey });
    }
  };

  const removeSkill = async (skillTypeId: string) => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    setIsUpdating(true);

    const queryKey = ['user-profiles', 'detail', userId];
    await queryClient.cancelQueries({ queryKey });
    const previousProfile = queryClient.getQueryData<Profile>(queryKey);

    const updatedSkills = skills
      .filter((s) => s.skillTypeId !== skillTypeId)
      .map((s, index) => ({
        skillTypeId: s.skillTypeId,
        level: s.level,
        isPrimary: index === 0,
      }));

    if (previousProfile) {
      queryClient.setQueryData<Profile>(queryKey, {
        ...previousProfile,
        skills: skills.filter((s) => s.skillTypeId !== skillTypeId),
      });
    }

    try {
      await updateUserProfile(userId, { skills: updatedSkills });
      toast.success('플레이 파트가 삭제되었습니다.');
    } catch {
      if (previousProfile) {
        queryClient.setQueryData(queryKey, previousProfile);
      }
      toast.error('파트 삭제 도중 에러가 발생했습니다.');
    } finally {
      isUpdatingRef.current = false;
      setIsUpdating(false);
      queryClient.invalidateQueries({ queryKey });
    }
  };

  return (
    <section
      aria-labelledby="profile-skill-title"
      className="relative flex flex-col items-start gap-2.5 self-stretch rounded-md bg-surface-3 p-4 text-grey-50"
    >
      <h2 id="profile-skill-title" className="typo-base-b">
        플레이 파트
      </h2>

      <div className="flex flex-wrap gap-2.5">
        {skills.map((skill) => (
          <span
            key={skill.skillTypeId}
            className="flex items-center rounded-full border border-surface-2 px-4 py-1.5 typo-base-sb"
          >
            {skill.skillName}
            {isMe && (
              <button
                type="button"
                aria-label={`${skill.skillName} 삭제`}
                disabled={isUpdating}
                onClick={() => removeSkill(skill.skillTypeId)}
                className="-my-2 -mr-3 ml-1 rounded-full p-2 text-grey-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="size-3.5" />
              </button>
            )}
          </span>
        ))}
        {isMe && (
          <Button
            onClick={() => setIsSheetOpen(true)}
            disabled={isUpdating}
            size="icon"
            className="size-9 cursor-pointer bg-surface-1"
            aria-label="플레이 파트 수정"
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

      <TagSelectBottomSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title="플레이 파트"
        items={availableSkills}
        selectedIds={skills.map((s) => s.skillTypeId)}
        isLoading={skillsQuery.isLoading}
        onSave={handleSaveSkills}
      />
    </section>
  );
}
