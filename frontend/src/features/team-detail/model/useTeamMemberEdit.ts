import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { BandMemberListItem } from '@/entities/member/model/types';
import type { TeamMember } from '@/entities/team/model/types';

interface UseTeamMemberEditProps {
  propMembers: TeamMember[];
}

/** 다른 행이 이미 쓰고 있는 세션인지. 세션 하나에 한 명이 계약이다. */
const isSessionTakenByOtherRow = (
  members: TeamMember[],
  skillTypeId: string | null,
  exceptIndex: number | null,
) =>
  skillTypeId !== null &&
  members.some(
    (member, idx) =>
      idx !== exceptIndex && member.skillType?.skillTypeId === skillTypeId,
  );

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

    // 사람만 바뀌어도 그 행이 들고 있던 세션은 그대로 남는다. 다른 행이 같은
    // 세션을 쓰고 있으면 교체 후 중복이 되므로 여기서도 막는다.
    if (
      isSessionTakenByOtherRow(
        currentMembers,
        targetSkillTypeId,
        selectedSessionIndex,
      )
    ) {
      toast.warning('이미 다른 팀원이 맡은 세션이에요.');
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
    // 여기서 막지 않으면 중복 skillTypeId가 그대로 저장 요청에 실린다.
    // 비우는 것(null)은 언제나 허용한다.
    if (
      isSessionTakenByOtherRow(
        currentMembers,
        skillType?.skillTypeId ?? null,
        index,
      )
    ) {
      toast.warning('이미 다른 팀원이 맡은 세션이에요.');
      return;
    }
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
