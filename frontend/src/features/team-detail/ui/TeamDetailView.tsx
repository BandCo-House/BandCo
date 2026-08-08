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

      {/* 2. 팀원 목록 섹션 (Figma MCP Node 1930:19190 100% 그대로 적용) */}
      <div className="bg-[var(--surface\/3,rgba(101,99,122,0.48))] border-[0.667px] border-[var(--greyscale\/500,#28272a)] border-solid content-stretch flex flex-col gap-[var(--xs,12px)] items-start p-[var(--xl-2,20.667px)] relative rounded-[var(--round\/md,20px)] w-full">
        <div className="relative shrink-0 w-full">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">
            <p className="[word-break:break-word] font-['SUIT:Bold'] leading-[1.4] not-italic relative shrink-0 text-[color:var(--greyscale\/50,white)] text-[length:var(--base,16px)] whitespace-nowrap">
              팀원 목록
            </p>
            {!isEditing && (
              <button
                type="button"
                onClick={onToggleEdit}
                aria-label="팀원 수정"
                className="content-stretch flex gap-[10px] items-center justify-center px-[12px] py-[8px] relative rounded-[24px] shrink-0 text-[color:var(--greyscale\/300,#9d9d9f)] hover:text-white transition-colors"
              >
                <span className="[word-break:break-word] font-['SUIT:Medium'] leading-[1.4] not-italic text-[14px] text-center whitespace-nowrap">
                  수정
                </span>
                <Pencil className="size-[16px]" />
              </button>
            )}
          </div>
        </div>

        {!isEditing ? (
          /* 읽기 모드: Figma MCP Node 1930:19194 팀원 상세 그대로 */
          <div className="relative shrink-0 w-full">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-start flex flex-wrap gap-[6px] items-start relative size-full">
              {currentMembers.map((member) => (
                <div
                  key={member.teamMemberId}
                  className="bg-[var(--surface\/2,rgba(97,117,158,0.56))] content-stretch flex gap-[5px] items-center px-[12px] py-[4px] relative rounded-[var(--round\/full,999px)] shrink-0"
                >
                  <p className="[word-break:break-word] font-['SUIT:SemiBold'] leading-[1.4] not-italic relative shrink-0 text-[color:var(--primary\/main,#ecfcab)] text-[length:var(--base,16px)] whitespace-nowrap">
                    {member.sessionName || '세션'}:
                  </p>
                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                    <Avatar className="size-[32px] rounded-[20px] shrink-0">
                      <AvatarImage
                        src={member.user.profileImageUrl || undefined}
                        alt={member.user.nickname}
                      />
                      <AvatarFallback className="text-xs">
                        {member.user.nickname.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="[word-break:break-word] font-['SUIT:Medium'] leading-[1.4] not-italic relative shrink-0 text-[color:var(--greyscale\/50,white)] text-[length:var(--sm,14px)] whitespace-nowrap">
                      {member.user.nickname}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* 피그마 팀원 수정 모드: Node 1930:19309 그대로 반영 (라임 #ECFCAB 밑줄 Input + 40px 원형 🔍 돋보기 버튼) */
          <div className="relative shrink-0 w-full pt-1">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[16px] items-start relative size-full">
              {currentMembers.map((member, idx) => (
                <div
                  key={member.teamMemberId}
                  className="content-stretch flex gap-[8px] items-center py-[2px] relative shrink-0 w-full"
                >
                  {/* 좌측 세션명 + 라임 #ECFCAB 밑줄 */}
                  <div className="border-[var(--primary\/main,#ecfcab)] border-b border-solid content-stretch flex flex-[1_0_0] gap-[12px] h-[54px] items-center min-w-px px-[12px] py-[16px] relative">
                    <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-center min-w-px relative">
                      <p className="[word-break:break-word] font-['SUIT:SemiBold'] leading-[1.4] not-italic text-[16px] text-[color:var(--greyscale\/50,white)] whitespace-nowrap">
                        {member.sessionName || `세션${idx + 1}`}
                      </p>
                    </div>
                  </div>

                  {/* 멤버 칩 (Figma profileUI Node 1930:19315 그대로) */}
                  <div className="bg-[var(--surface\/2,rgba(97,117,158,0.56))] content-stretch flex items-center px-[12px] py-[6px] relative rounded-[var(--round\/full,999px)] shrink-0">
                    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                      <Avatar className="size-[32px] rounded-[20px] shrink-0">
                        <AvatarImage
                          src={member.user.profileImageUrl || undefined}
                          alt={member.user.nickname}
                        />
                        <AvatarFallback className="text-xs">
                          {member.user.nickname.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="[word-break:break-word] font-['SUIT:Medium'] leading-[1.4] not-italic relative shrink-0 text-[color:var(--greyscale\/50,white)] text-[length:var(--sm,14px)] whitespace-nowrap">
                        {member.user.nickname}
                      </p>
                    </div>
                  </div>

                  {/* 라임 🔍 돋보기 40px 원형 버튼 (Node 1930:19317 그대로) */}
                  <button
                    type="button"
                    onClick={() => handleOpenSearchForSession(idx)}
                    className="bg-(--surface\/2,rgba(97,117,158,0.56)) content-stretch flex items-center justify-center relative rounded-[var(--round\/full,999px)] shrink-0 size-[40px] text-[color:var(--primary\/main,#ecfcab)] hover:bg-[#61759E]/80 transition-colors"
                    aria-label={`${member.sessionName} 멤버 변경`}
                  >
                    <Search className="size-6" />
                  </button>
                </div>
              ))}

              {/* 미할당 세션 추가 라인 */}
              <div className="content-stretch flex gap-2 items-center py-[2px] relative shrink-0 w-full">
                <div className="border-[var(--greyscale\/500,#3D3E54)] border-b border-solid content-stretch flex flex-[1_0_0] gap-[12px] h-[54px] items-center min-w-px px-[12px] py-[16px] relative">
                  <p className="font-['SUIT:Regular'] text-[16px] text-[#9D9D9F]">
                    {`세션${currentMembers.length + 1}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSessionIndex(null);
                    setSearchModalOpen(true);
                  }}
                  className="bg-[var(--surface\/2,rgba(97,117,158,0.56))] content-stretch flex items-center justify-center relative rounded-[var(--round\/full,999px)] shrink-0 size-[40px] text-[color:var(--primary\/main,#ecfcab)] hover:bg-[#61759E]/80 transition-colors"
                  aria-label="세션 멤버 검색"
                >
                  <Search className="size-[24px]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. 참여중인 합주 공간, 합주곡, 팀 파일 섹션 (수정 모드일 때는 피그마 명세에 따라 숨김) */}
      {!isEditing && (
        <>
          {/* 참여중인 합주 공간 섹션 (Figma MCP Node 1930:19210 100% 반영) */}
          <div className="bg-[var(--surface\/3,rgba(101,99,122,0.48))] border-[0.667px] border-[var(--greyscale\/500,#28272a)] border-solid content-stretch flex flex-col gap-[12px] items-start p-[20.667px] relative rounded-[20px] w-full">
            <div className="relative shrink-0">
              <p className="font-['SUIT:Bold'] leading-[1.4] not-italic text-white text-[16px] whitespace-nowrap">
                참여중인 합주 공간
              </p>
            </div>
            <div className="relative shrink-0 w-full">
              <div className="content-stretch flex flex-col gap-[6px] items-start justify-center relative w-full">
                {/* 1번째 항목: 상시 정기 모임 */}
                <div className="content-stretch flex gap-[8px] items-center p-[16px] relative shrink-0 w-full hover:bg-white/5 transition-colors rounded-xl cursor-pointer">
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start justify-center min-w-px relative">
                    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                      <div className="bg-[var(--greyscale\/100,#dfdfe1)] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[999px] shrink-0">
                        <p className="font-['SUIT:SemiBold'] leading-[1.4] not-italic text-[12px] text-black whitespace-nowrap">
                          상시
                        </p>
                      </div>
                      <p className="font-['SUIT:SemiBold'] leading-[1.4] not-italic text-white text-[18px] whitespace-nowrap">
                        정기 모임
                      </p>
                    </div>
                    <p className="font-['SUIT:Regular'] leading-[1.4] not-italic text-[14px] text-[color:var(--greyscale\/200,#c6c6c8)] whitespace-nowrap">
                      정기 연주 및 신곡 연습
                    </p>
                  </div>
                  <ChevronRight className="size-[24px] text-[color:var(--greyscale\/200,#c6c6c8)] shrink-0" />
                </div>

                {/* 2번째 항목: D-2 봄꽃 축제 (하단 테두리 포함) */}
                <div className="border-[var(--greyscale\/500,#28272a)] border-b border-solid content-stretch flex gap-[8px] items-center p-[16px] relative shrink-0 w-full hover:bg-white/5 transition-colors rounded-xl cursor-pointer">
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start justify-center min-w-px relative">
                    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                      <div className="bg-[var(--semantic\/destructive\/surface,#fee6e1)] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[999px] shrink-0">
                        <p className="font-['SUIT:SemiBold'] leading-[1.4] not-italic text-[12px] text-[color:var(--semantic\/destructive\/main,#d6705c)] whitespace-nowrap">
                          D-2
                        </p>
                      </div>
                      <p className="font-['SUIT:SemiBold'] leading-[1.4] not-italic text-white text-[18px] whitespace-nowrap">
                        봄꽃 축제
                      </p>
                    </div>
                    <p className="font-['SUIT:Regular'] leading-[1.4] not-italic text-[14px] text-[color:var(--greyscale\/200,#c6c6c8)] whitespace-nowrap">
                      봄꽃 축제 연주곡 연습
                    </p>
                  </div>
                  <ChevronRight className="size-[24px] text-[color:var(--greyscale\/200,#c6c6c8)] shrink-0" />
                </div>

                {/* 3번째 항목: D-90 2026 하계 공연 무대 (하단 테두리 포함) */}
                <div className="border-[var(--greyscale\/500,#28272a)] border-b border-solid content-stretch flex gap-[8px] items-center p-[16px] relative shrink-0 w-full hover:bg-white/5 transition-colors rounded-xl cursor-pointer">
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start justify-center min-w-px relative">
                    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                      <div className="bg-[var(--greyscale\/100,#dfdfe1)] content-stretch flex items-start px-[8px] py-[2px] relative rounded-[999px] shrink-0">
                        <p className="font-['SUIT:SemiBold'] leading-[1.4] not-italic text-[12px] text-black whitespace-nowrap">
                          D-90
                        </p>
                      </div>
                      <p className="font-['SUIT:SemiBold'] leading-[1.4] not-italic text-white text-[18px] whitespace-nowrap">
                        2026 하계 공연 무대
                      </p>
                    </div>
                    <p className="font-['SUIT:Regular'] leading-[1.4] not-italic text-[14px] text-[color:var(--greyscale\/200,#c6c6c8)] whitespace-nowrap">
                      여름 축제 공연 준비
                    </p>
                  </div>
                  <ChevronRight className="size-[24px] text-[color:var(--greyscale\/200,#c6c6c8)] shrink-0" />
                </div>
              </div>
            </div>
          </div>

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
