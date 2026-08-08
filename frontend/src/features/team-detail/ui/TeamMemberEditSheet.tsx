import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { Button } from '@/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { MemberSearchModal } from '@/features/schedule-create/ui/components/MemberSearchModal';
import type { TeamMember } from '@/entities/team/model/types';
import type { BandMember } from '@/entities/member/model/types';

interface TeamMemberEditSheetProps {
  open: boolean;
  bandId: string;
  members: TeamMember[];
  onOpenChange: (open: boolean) => void;
  onSave: (updatedMembers: TeamMember[]) => void;
}

export const TeamMemberEditSheet: React.FC<TeamMemberEditSheetProps> = ({
  open,
  bandId,
  members: initialMembers,
  onOpenChange,
  onSave,
}) => {
  const [currentMembers, setCurrentMembers] = useState<TeamMember[]>(initialMembers);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const handleMemberSelect = (selectedBandMember: BandMember) => {
    const newMember: TeamMember = {
      teamMemberId: `tm-${Date.now()}`,
      bandMemberId: selectedBandMember.bandMemberId,
      user: {
        userId: selectedBandMember.userId,
        nickname: selectedBandMember.nickname,
        profileImageUrl: selectedBandMember.profileImageUrl ?? null,
      },
      teamRole: 'MEMBER',
      sessionName: '세션',
    };
    setCurrentMembers((prev) => [...prev, newMember]);
    setSearchModalOpen(false);
  };

  const handleRemoveMember = (teamMemberId: string) => {
    setCurrentMembers((prev) =>
      prev.filter((m) => m.teamMemberId !== teamMemberId),
    );
  };

  const handleSave = () => {
    onSave(currentMembers);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
          <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
            <SheetTitle className="typo-lg-sb text-foreground">
              팀원 수정
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSave}
                aria-label="완료"
                className="typo-sm-m"
              >
                완료
              </Button>
            </div>
          </SheetHeader>

          <div className="flex flex-col gap-5 p-5">
            <div className="flex items-center justify-between">
              <span className="typo-md-sb text-foreground">팀원 목록</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSearchModalOpen(true)}
                className="typo-sm-m"
              >
                팀원 추가
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {currentMembers.map((member) => (
                <div
                  key={member.teamMemberId}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={member.user.profileImageUrl || undefined}
                        alt={member.user.nickname}
                      />
                      <AvatarFallback className="text-xs">
                        {member.user.nickname.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="typo-sm-sb text-foreground">
                        {member.user.nickname}
                      </span>
                      <span className="typo-xs-r text-muted-foreground">
                        {member.sessionName || '세션'}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.teamMemberId)}
                    className="typo-xs-r text-destructive hover:bg-destructive/10"
                  >
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {searchModalOpen && (
        <MemberSearchModal
          open={searchModalOpen}
          bandId={bandId}
          onClose={() => setSearchModalOpen(false)}
          onSelect={handleMemberSelect}
        />
      )}
    </>
  );
};
