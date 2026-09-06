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
    const isDuplicate = currentMembers.some(
      (m, idx) =>
        m.bandMemberId === picked.bandMemberId &&
        idx !== selectedSessionIndex, // 자기 자신(현재 세션)은 중복으로 보지 않음
    );

    if (isDuplicate) {
      toast.warning('이미 팀에 포함되어 있습니다.');
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

  const handleOpenSearchForNewMember = () => {
    setSelectedSessionIndex(null);
    setSearchModalOpen(true);
  };

  return {
    currentMembers,
    searchModalOpen,
    setSearchModalOpen,
    handleToggleMember,
    handleOpenSearchForSession,
    handleOpenSearchForNewMember,
  };
}
