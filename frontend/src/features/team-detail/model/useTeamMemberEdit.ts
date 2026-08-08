import { useState, useEffect } from 'react';
import type { TeamMember } from '@/entities/team/model/types';

interface UseTeamMemberEditProps {
  propMembers: TeamMember[];
}

export function useTeamMemberEdit({ propMembers }: UseTeamMemberEditProps) {
  const [currentMembers, setCurrentMembers] = useState<TeamMember[]>(propMembers);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number | null>(null);

  useEffect(() => {
    setCurrentMembers(propMembers);
  }, [propMembers]);

  const handleToggleMember = (bandMemberId: string) => {
    if (selectedSessionIndex !== null && selectedSessionIndex < currentMembers.length) {
      // 기존 세션의 멤버 변경
      setCurrentMembers((prev) =>
        prev.map((m, idx) =>
          idx === selectedSessionIndex
            ? {
                ...m,
                bandMemberId,
                user: {
                  userId: `u-${bandMemberId}`,
                  nickname: '선택 멤버',
                  profileImageUrl: null,
                },
              }
            : m,
        ),
      );
    } else {
      // 신규 멤버/세션 추가
      const newMember: TeamMember = {
        teamMemberId: `tm-${Date.now()}`,
        bandMemberId,
        user: {
          userId: `u-${bandMemberId}`,
          nickname: '신규 멤버',
          profileImageUrl: null,
        },
        teamRole: 'MEMBER',
        sessionName: `세션${currentMembers.length + 1}`,
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
