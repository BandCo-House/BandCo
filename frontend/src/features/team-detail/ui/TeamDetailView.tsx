import React from 'react';
import { Music, FileText, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { StatusBadge } from '@/shared/ui/status-badge';
import { Button } from '@/shared/ui/button';
import type { TeamDetail, TeamMember } from '@/entities/team/model/types';

interface TeamDetailViewProps {
  team: TeamDetail;
  members: TeamMember[];
  onDeleteTeam: () => void;
  onEditMembers: () => void;
}

export const TeamDetailView: React.FC<TeamDetailViewProps> = ({
  team,
  members,
  onDeleteTeam,
  onEditMembers,
}) => {
  return (
    <div className="flex flex-col gap-6 px-5 py-4 text-foreground">
      {/* 1. 팀원 목록 섹션 */}
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3">
          <h3 className="typo-lg-sb">팀원 목록</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEditMembers}
            aria-label="팀원 수정"
            className="typo-sm-m text-primary"
          >
            수정
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          {members.map((member) => (
            <div
              key={member.teamMemberId}
              className="flex items-center gap-2 rounded-lg bg-background p-2.5"
            >
              <span className="typo-xs-r text-muted-foreground">
                {member.sessionName || '세션'}:
              </span>
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={member.user.profileImageUrl || undefined}
                    alt={member.user.nickname}
                  />
                  <AvatarFallback className="text-xs">
                    {member.user.nickname.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="typo-sm-m text-foreground">
                  {member.user.nickname}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. 참여중인 합주 공간 섹션 */}
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <h3 className="typo-lg-sb pb-3">참여중인 합주 공간</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg bg-background p-3.5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <StatusBadge variant="default">상시</StatusBadge>
                <span className="typo-base-sb">정기 모임</span>
              </div>
              <p className="typo-xs-r text-muted-foreground">
                정기 연주 및 신곡 연습
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background p-3.5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <StatusBadge variant="accent">D-2</StatusBadge>
                <span className="typo-base-sb">봄꽃 축제</span>
              </div>
              <p className="typo-xs-r text-muted-foreground">
                봄꽃 축제 연주곡 연습
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* 3. 합주곡 섹션 */}
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <h3 className="typo-lg-sb pb-3">합주곡</h3>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between rounded-lg bg-background p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary">
                <Music className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="typo-sm-sb">마치 흘러가는 바람처럼</span>
                <span className="typo-xs-r text-muted-foreground">
                  DAY6(데이식스)
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary">
                <Music className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="typo-sm-sb">좋은 날</span>
                <span className="typo-xs-r text-muted-foreground">
                  IU(아이유)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 팀 파일 섹션 */}
      <section className="rounded-xl bg-card p-4 shadow-sm">
        <h3 className="typo-lg-sb pb-3">팀 파일</h3>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between rounded-lg bg-background p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="typo-sm-sb">악보1</span>
                <span className="typo-xs-r text-muted-foreground">
                  26.03.04
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 헤더 또는 하단에 위치 가능한 팀 삭제 버튼 */}
      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          variant="destructive"
          onClick={onDeleteTeam}
          aria-label="팀 삭제"
          className="w-full"
        >
          팀 삭제
        </Button>
      </div>
    </div>
  );
};
