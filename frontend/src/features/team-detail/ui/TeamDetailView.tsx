import React, { useState, useEffect } from 'react';
import { Music, Folder, ChevronRight, Pencil, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { StatusBadge } from '@/shared/ui/status-badge';
import { MemberSearchModal } from '@/features/schedule-create/ui/components/MemberSearchModal';
import type { TeamDetail, TeamMember } from '@/entities/team/model/types';

interface TeamDetailViewProps {
  team: TeamDetail;
  members: TeamMember[];
  isEditing?: boolean;
  bandId?: string;
  onToggleEdit?: () => void;
  onSaveMembers?: (updatedMembers: TeamMember[]) => void;
  onDeleteTeam: () => void;
}

export const TeamDetailView: React.FC<TeamDetailViewProps> = ({
  team,
  members: propMembers,
  isEditing = false,
  bandId = '',
  onToggleEdit,
}) => {
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

  return (
    <div className="flex flex-col gap-4 px-5 pt-0 -mt-1 pb-8 text-foreground">
      {/* 1. 서브 헤더 라인: 팀 이름 (좌측) + 팀원 추가 (우측 - 수정 모드일 때만 라임 캡슐) */}
      <div className="flex items-center justify-between">
        <h2 className="typo-lg-sb text-grey-100">{team.name || '듀얼 기타 편성'}</h2>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setSelectedSessionIndex(null);
              setSearchModalOpen(true);
            }}
            aria-label="팀원 추가"
            className="rounded-[24px] bg-[#ECFCAB] px-4 py-2 typo-sm-sb text-[#1B1B32] shadow-xs hover:bg-[#DDFE55] transition-colors"
          >
            팀원 추가
          </button>
        )}
      </div>

      {/* 2. 팀원 목록 섹션 */}
      <section className="rounded-[20px] border border-[#28272a] bg-[#65637a]/40 p-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between pb-3">
          <h3 className="typo-base-sb text-grey-100">팀원 목록</h3>
          {!isEditing && (
            <button
              type="button"
              onClick={onToggleEdit}
              aria-label="팀원 수정"
              className="flex items-center gap-1 typo-xs-r text-grey-300 hover:text-foreground"
            >
              <span>수정</span>
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {!isEditing ? (
          /* 읽기 모드: 피그마 알약 캡슐(Pill) 스타일 */
          <div className="flex flex-wrap gap-2.5 pt-1">
            {currentMembers.map((member) => (
              <div
                key={member.teamMemberId}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#3d3e54] px-3.5 py-1.5 shadow-xs"
              >
                <span className="typo-xs-sb text-secondary">
                  {member.sessionName || '세션'}:
                </span>
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={member.user.profileImageUrl || undefined}
                    alt={member.user.nickname}
                  />
                  <AvatarFallback className="text-[10px]">
                    {member.user.nickname.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="typo-xs-m text-grey-100">
                  {member.user.nickname}
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* 피그마 팀원 수정 모드: 세션별 언더라인 행 + 멤버 칩 + 원형 돋보기 🔍 버튼 */
          <div className="flex flex-col gap-4 pt-1">
            {currentMembers.map((member, idx) => (
              <div
                key={member.teamMemberId}
                className="flex items-center justify-between pb-2"
              >
                {/* 좌측 세션명 + 밑줄 */}
                <div className="flex-1 border-b border-[#3D3E54] pb-1.5 mr-3">
                  <span className="typo-sm-sb text-grey-100">
                    {member.sessionName || `세션${idx + 1}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* 멤버 칩 */}
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#3d3e54] px-3 py-1.5">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={member.user.profileImageUrl || undefined}
                        alt={member.user.nickname}
                      />
                      <AvatarFallback className="text-[10px]">
                        {member.user.nickname.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="typo-xs-m text-grey-100">
                      {member.user.nickname}
                    </span>
                  </div>

                  {/* 돋보기 버튼 */}
                  <button
                    type="button"
                    onClick={() => handleOpenSearchForSession(idx)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3d3e54] text-grey-200 hover:text-foreground hover:bg-[#4a4b64] transition-colors"
                    aria-label={`${member.sessionName} 멤버 변경`}
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* 미할당 세션 추가 라인 */}
            <div className="flex items-center justify-between pb-1 pt-1">
              <div className="flex-1 border-b border-[#3D3E54] pb-1.5 mr-3">
                <span className="typo-sm-r text-grey-400">
                  {`세션${currentMembers.length + 1}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSessionIndex(null);
                  setSearchModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#3d3e54] px-3.5 py-2 typo-xs-m text-grey-200 hover:text-foreground hover:bg-[#4a4b64] transition-colors"
              >
                <Search className="h-3.5 w-3.5 text-secondary" />
                <span>멤버</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. 참여중인 합주 공간, 합주곡, 팀 파일 섹션 (수정 모드일 때는 피그마 명세에 따라 숨김) */}
      {!isEditing && (
        <>
          {/* 참여중인 합주 공간 섹션 */}
          <section className="rounded-[20px] border border-[#28272a] bg-[#65637a]/40 p-4 shadow-sm backdrop-blur-md">
            <h3 className="typo-base-sb text-grey-100 pb-3">참여중인 합주 공간</h3>
            <div className="flex flex-col">
              <div className="flex items-center justify-between py-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge variant="default">상시</StatusBadge>
                    <span className="typo-sm-sb text-grey-100">정기 모임</span>
                  </div>
                  <p className="typo-xs-r text-grey-300">
                    정기 연주 및 신곡 연습
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-grey-300" />
              </div>

              <div className="border-b border-[#28272a]" />

              <div className="flex items-center justify-between py-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge variant="accent">D-2</StatusBadge>
                    <span className="typo-sm-sb text-grey-100">봄꽃 축제</span>
                  </div>
                  <p className="typo-xs-r text-grey-300">
                    봄꽃 축제 연주곡 연습
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-grey-300" />
              </div>

              <div className="border-b border-[#28272a]" />

              <div className="flex items-center justify-between py-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge variant="outline">D-90</StatusBadge>
                    <span className="typo-sm-sb text-grey-100">
                      2026 하계 공연 무대
                    </span>
                  </div>
                  <p className="typo-xs-r text-grey-300">여름 축제 공연 준비</p>
                </div>
                <ChevronRight className="h-5 w-5 text-grey-300" />
              </div>
            </div>
          </section>

          {/* 합주곡 섹션 */}
          <section className="rounded-[20px] border border-[#28272a] bg-[#65637a]/40 p-4 shadow-sm backdrop-blur-md">
            <h3 className="typo-base-sb text-grey-100 pb-3">합주곡</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3d3e54] text-secondary">
                    <Music className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="typo-sm-sb text-grey-100">
                      마치 흘러가는 바람처럼
                    </span>
                    <span className="typo-xs-r text-grey-300">
                      DAY6(데이식스)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 typo-xs-r text-grey-300">
                  <span>곡 상세</span>
                  <ChevronRight className="h-4 w-4 text-grey-300" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3d3e54] text-secondary">
                    <Music className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="typo-sm-sb text-grey-100">좋은 날</span>
                    <span className="typo-xs-r text-grey-300">IU(아이유)</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 typo-xs-r text-grey-300">
                  <span>곡 상세</span>
                  <ChevronRight className="h-4 w-4 text-grey-300" />
                </div>
              </div>
            </div>
          </section>

          {/* 팀 파일 섹션 */}
          <section className="rounded-[20px] border border-[#28272a] bg-[#65637a]/40 p-4 shadow-sm backdrop-blur-md">
            <h3 className="typo-base-sb text-grey-100 pb-3">팀 파일</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3d3e54] text-grey-200">
                    <Folder className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="typo-sm-sb text-grey-100">악보1</span>
                    <span className="typo-xs-r text-grey-300">23.03.04</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 typo-xs-r text-grey-300">
                  <span>파일 상세</span>
                  <ChevronRight className="h-4 w-4 text-grey-300" />
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* 멤버 검색 모달 연동 */}
      {searchModalOpen && (
        <MemberSearchModal
          open={searchModalOpen}
          onOpenChange={setSearchModalOpen}
          bandId={bandId}
          selectedIds={currentMembers.map((m) => m.bandMemberId)}
          onToggleMember={handleToggleMember}
        />
      )}
    </div>
  );
};
