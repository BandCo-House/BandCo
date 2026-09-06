import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { useBandMembers } from '@/entities/member/api/useBandMembers';
import { useSkillTypes } from '@/entities/skill/api/useSkillTypes';
import { getTeamMembers } from '@/entities/team/api/team-api';
import { teamKeys } from '@/entities/team/api/queries';
import type { BandMemberListItem } from '@/entities/member/model/types';
import { FieldLabel, fieldSurfaceClass } from '@/shared/ui/field';
import { SelectField } from '@/shared/ui/select-field';
import { cn } from '@/shared/lib/utils';
import type { ScheduleSessionAssignment } from '../../model/types';
import { MemberCard } from './MemberCard';
import { MemberSearchModal } from './MemberSearchModal';

interface SessionSectionProps {
  bandId: string;
  /** 세션 편성(추가 순서 유지). */
  value: ScheduleSessionAssignment[];
  onChange: (assignments: ScheduleSessionAssignment[]) => void;
}

/**
 * 합주 전용 세션 편성.
 * 세션을 고른 뒤 멤버 입력을 눌러 한 명을 배정하면 카드 한 장이 생긴다.
 * 같은 사람을 다른 세션에 또 배정할 수 있다(보컬 겸 기타).
 * 팀을 고르면 그 팀의 세션 배정을 그대로 옮겨 담는다.
 */
export const SessionSection = ({
  bandId,
  value,
  onChange,
}: SessionSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingSkillTypeId, setPendingSkillTypeId] = useState<string | null>(
    null,
  );
  const queryClient = useQueryClient();
  const { data: members = [] } = useBandMembers(bandId);
  const { data: skillTypes = [] } = useSkillTypes();

  const memberById = new Map(members.map((m) => [m.bandMemberId, m]));
  const skillNameById = new Map(skillTypes.map((s) => [s.id, s.name]));

  const openMemberPicker = () => {
    if (!pendingSkillTypeId) {
      toast.error('세션을 먼저 선택해주세요.');
      return;
    }
    setIsModalOpen(true);
  };

  // 세션 하나에 한 명. 같은 세션을 다시 배정하면 이전 멤버를 갈아끼운다.
  const assignMember = (member: BandMemberListItem) => {
    if (!pendingSkillTypeId) return;
    const withoutSameSession = value.filter(
      (assignment) => assignment.skillTypeId !== pendingSkillTypeId,
    );
    onChange([
      ...withoutSameSession,
      { skillTypeId: pendingSkillTypeId, bandMemberId: member.bandMemberId },
    ]);
    setIsModalOpen(false);
  };

  // 세션과 멤버를 모두 봐야 한다. 세션만 보면 같은 세션에 두 명이 실려 온 경우
  // (상세에서 복원했거나 팀 편성을 옮겨 왔을 때) 한 번 눌러 둘 다 사라진다.
  const removeAssignment = (target: ScheduleSessionAssignment) =>
    onChange(
      value.filter(
        (assignment) =>
          !(
            assignment.skillTypeId === target.skillTypeId &&
            assignment.bandMemberId === target.bandMemberId
          ),
      ),
    );

  // 팀 멤버는 목록 응답에 없어 고를 때 한 번 가져온다. 세션이 배정된 팀원만 옮긴다.
  const selectTeam = async (teamId: string) => {
    try {
      const teamMembers = await queryClient.fetchQuery({
        queryKey: teamKeys.members(teamId),
        queryFn: () => getTeamMembers(teamId),
      });
      const fromTeam = teamMembers
        .filter((member) => member.skillType)
        .map((member) => ({
          skillTypeId: member.skillType!.skillTypeId,
          bandMemberId: member.bandMemberId,
        }));

      if (fromTeam.length === 0) {
        toast.error('이 팀은 아직 세션 편성이 없어요.');
        return;
      }

      // 팀 편성이 같은 세션을 덮어쓴다 — 팀을 고른 의도가 그 편성을 쓰겠다는 뜻이다.
      const replacedSessions = new Set(fromTeam.map((a) => a.skillTypeId));
      onChange([
        ...value.filter((a) => !replacedSessions.has(a.skillTypeId)),
        ...fromTeam,
      ]);
      setIsModalOpen(false);
    } catch {
      toast.error('팀 편성을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <section
      className="flex flex-col gap-3"
      role="group"
      aria-label="세션 편성"
      aria-required
    >
      <FieldLabel required>세션 편성</FieldLabel>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <span className="typo-sm-sb text-grey-200">세션 선택</span>
          <SelectField
            value={pendingSkillTypeId}
            onValueChange={setPendingSkillTypeId}
            options={skillTypes.map((skill) => ({
              value: skill.id,
              label: skill.name,
            }))}
            placeholder="전체"
            ariaLabel="세션 선택"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="typo-sm-sb text-grey-200">멤버 선택</span>
          <button
            type="button"
            onClick={openMemberPicker}
            className={cn(
              fieldSurfaceClass,
              'flex w-full items-center gap-3 typo-base-sb text-grey-300',
            )}
          >
            <Search aria-hidden="true" className="size-6 text-grey-300" />
            <span>전체</span>
          </button>
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {value.map((assignment) => {
            const member = memberById.get(assignment.bandMemberId);
            return (
              <div
                key={`${assignment.skillTypeId}-${assignment.bandMemberId}`}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="typo-sm-b text-grey-50">
                    {skillNameById.get(assignment.skillTypeId) ?? '세션'}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAssignment(assignment)}
                    className="typo-sm-sb text-grey-300 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    삭제
                  </button>
                </div>
                <MemberCard
                  name={member?.nickname ?? '알 수 없는 멤버'}
                  sessions={member?.skills.map((s) => s.skillName) ?? []}
                  className="min-h-[92px]"
                />
              </div>
            );
          })}
        </div>
      )}

      <MemberSearchModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        bandId={bandId}
        // 한 명만 고르는 모달이라 지금 고르는 세션에 배정된 사람만 선택 상태다.
        // 전체를 넘기면 radiogroup 안에서 aria-checked가 여러 개 true가 된다.
        selectedIds={
          pendingSkillTypeId
            ? value
                .filter(
                  (assignment) => assignment.skillTypeId === pendingSkillTypeId,
                )
                .map((assignment) => assignment.bandMemberId)
            : []
        }
        onToggleMember={assignMember}
        onSelectTeam={(teamId) => void selectTeam(teamId)}
        singleSelect
      />
    </section>
  );
};
