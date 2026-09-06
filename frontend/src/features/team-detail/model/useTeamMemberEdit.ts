import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { BandMemberListItem } from '@/entities/member/model/types';
import type { TeamMember } from '@/entities/team/model/types';

interface UseTeamMemberEditProps {
  propMembers: TeamMember[];
}

export function useTeamMemberEdit({ propMembers }: UseTeamMemberEditProps) {
  const [currentMembers, setCurrentMembers] =
    useState<TeamMember[]>(propMembers);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    setCurrentMembers(propMembers);
  }, [propMembers]);

  const handleToggleMember = (picked: BandMemberListItem) => {
    // 한 사람이 보컬·기타를 겸할 수 있으므로 세션까지 같아야 중복이다.
    const targetSkillTypeId =
      selectedSessionIndex !== null
        ? (currentMembers[selectedSessionIndex]?.skillType?.skillTypeId ?? null)
        : null;
    const isDuplicate = currentMembers.some(
      (m, idx) =>
        m.bandMemberId === picked.bandMemberId &&
        (m.skillType?.skillTypeId ?? null) === targetSkillTypeId &&
        idx !== selectedSessionIndex,
    );

    if (isDuplicate) {
      toast.warning('이미 같은 세션으로 팀에 포함되어 있습니다.');
      setSearchModalOpen(false);
      setSelectedSessionIndex(null);
      return;
    }

    if (
      selectedSessionIndex !== null &&
      selectedSessionIndex < currentMembers.length
    ) {
      // 기존 세션의 멤버 변경
      setCurrentMembers((prev) =>
        prev.map((m, idx) =>
          idx === selectedSessionIndex
            ? {
                ...m,
                bandMemberId: picked.bandMemberId,
                skills: picked.skills,
                sessionName: picked.skills.map((s) => s.skillName).join(', '),
                user: {
                  userId: picked.userId,
                  nickname: picked.nickname,
                  profileImageUrl: picked.avatarUrl,
                },
              }
            : m,
        ),
      );
    } else {
      // 신규 멤버/세션 추가
      const newMember: TeamMember = {
        teamMemberId: `tm-${Date.now()}`,
        bandMemberId: picked.bandMemberId,
        // 세션은 아직 안 정해졌다. 목록에서 드롭다운으로 고른다.
        skillType: null,
        skills: picked.skills,
        user: {
          userId: picked.userId,
          nickname: picked.nickname,
          profileImageUrl: picked.avatarUrl,
        },
        teamRole: 'MEMBER',
        sessionName: picked.skills.map((s) => s.skillName).join(', '),
      };
      setCurrentMembers((prev) => [...prev, newMember]);
    }
    setSearchModalOpen(false);
    setSelectedSessionIndex(null);
  };

  const handleOpenSearchForSession = (index: number) => {
    setSelectedSessionIndex(index);
    setSearchModalOpen(true);
  };

  /** 세션 편성(팀에서 맡을 자리)을 바꾼다. 멤버가 가진 스킬(skills)과 다른 값이다. */
  const handleChangeSession = (
    index: number,
    skillType: { skillTypeId: string; name: string } | null,
  ) => {
    setCurrentMembers((prev) =>
      prev.map((member, idx) =>
        idx === index ? { ...member, skillType } : member,
      ),
    );
  };

  const handleOpenSearchForNewMember = () => {
    setSelectedSessionIndex(null);
    setSearchModalOpen(true);
  };

  return {
    currentMembers,
    searchModalOpen,
    setSearchModalOpen,
    handleToggleMember,
    handleChangeSession,
    handleOpenSearchForSession,
    handleOpenSearchForNewMember,
  };
}
