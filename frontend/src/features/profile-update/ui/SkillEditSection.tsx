import { useState } from 'react';
import type { Profile } from '@/entities/profile/model/types';
import { Button } from '@/shared/ui/button';
import { Plus, X, Loader2 } from 'lucide-react';
import { useSkillTypes } from '@/entities/skill';
import { updateUserProfile, type SkillLevel } from '../api/profile-api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

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
    <section
      aria-labelledby="profile-skill-title"
      className="relative flex flex-col items-start gap-2.5 self-stretch rounded-xl bg-surface-3 p-4 text-grey-50"
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
                onClick={() => removeSkill(skill.skillTypeId)}
                className="-my-2 -mr-3 ml-1 rounded-full p-2 text-grey-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
              >
                <X className="size-3.5" />
              </button>
            )}
          </span>
        ))}
        {isMe && !isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            size="icon"
            className="size-9 cursor-pointer bg-surface-1/40"
            aria-label="플레이 파트 추가"
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
        <div className="absolute top-full right-4 left-4 z-40 -mt-2 flex flex-col gap-2 rounded-2xl border border-grey-50/20 bg-surface-3 p-3 shadow-2xl backdrop-blur-xl">
          {skillsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 typo-xs-m text-grey-200">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>악기 파트 목록을 불러오는 중...</span>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Select value={selectedSkillId} onValueChange={setNewSkillId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="파트 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSkills.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={newSkillLevel}
                  onValueChange={(value) =>
                    setNewSkillLevel(value as SkillLevel)
                  }
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="레벨" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">초보자</SelectItem>
                    <SelectItem value="INTERMEDIATE">중급자</SelectItem>
                    <SelectItem value="ADVANCED">전문가</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-1 flex gap-2">
                <Button
                  size="sm"
                  onClick={addSkill}
                  variant="neutral"
                  className="flex-1 py-2 typo-sm-sb"
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
                  className="rounded-full border-grey-50/40 text-grey-100 hover:bg-white/12"
                >
                  취소
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
