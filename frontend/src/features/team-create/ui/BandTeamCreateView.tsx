import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  createTeam,
  getTeamMembers,
  replaceTeamMembers,
} from '@/entities/team/api/team-api';
import { teamKeys } from '@/entities/team/api/queries';
import { useBandMembers } from '@/entities/member/api/useBandMembers';
import { useSkillTypes } from '@/entities/skill/api/useSkillTypes';
import type { BandMemberListItem } from '@/entities/member/model/types';
import { MemberSearchModal } from '@/features/schedule-create/ui/components/MemberSearchModal';
import { Button } from '@/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { SelectField } from '@/shared/ui/select-field';
import { MEMBER_PICKER_TAKE } from '@/shared/lib/member-picker';

interface BandTeamCreateViewProps {
  bandId: string;
}

export const BandTeamCreateView = ({ bandId }: BandTeamCreateViewProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: bandMembers = [] } = useBandMembers(bandId, {
    take: MEMBER_PICKER_TAKE,
  });

  const [teamName, setTeamName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<BandMemberListItem[]>(
    [],
  );
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 팀에서 맡을 세션(bandMemberId → skillTypeId). 사람이 가진 스킬(skills)과 다른 값이다.
  const [sessionByMember, setSessionByMember] = useState<
    Record<string, string>
  >({});
  const {
    data: skillTypes = [],
    isLoading: isSkillTypesLoading,
    isError: isSkillTypesError,
  } = useSkillTypes();

  const setSession = (bandMemberId: string, skillTypeId: string | null) => {
    setSessionByMember((prev) => {
      const next = { ...prev };
      if (skillTypeId) next[bandMemberId] = skillTypeId;
      else delete next[bandMemberId];
      return next;
    });
  };

  const handleChangeSession = (bandMemberId: string, skillTypeId: string) => {
    // 세션 하나에 한 명이 서버 계약이라, 여기서 막지 않으면 저장할 때 400이 난다.
    const isTaken = selectedMembers.some(
      (m) =>
        m.bandMemberId !== bandMemberId &&
        sessionByMember[m.bandMemberId] === skillTypeId,
    );
    if (isTaken) {
      toast.warning('이미 다른 팀원이 맡은 세션이에요.');
      return;
    }
    setSession(bandMemberId, skillTypeId);
  };

  // 기본 팀 리더: 밴드 마스터(BM) 또는 첫 번째 멤버(로그인 유저)
  const creatorMember = useMemo(
    () => bandMembers.find((m) => m.role === 'BM') ?? bandMembers[0],
    [bandMembers],
  );

  // 초기 진입 시 팀 리더를 기본값으로 자동 등록
  useEffect(() => {
    if (creatorMember) {
      setSelectedMembers((prev) => {
        const hasCreator = prev.some(
          (m) => m.bandMemberId === creatorMember.bandMemberId,
        );
        if (hasCreator) return prev;
        return [creatorMember, ...prev];
      });
    }
  }, [creatorMember]);

  const handleOpenAddMember = () => {
    setEditingMemberId(null);
    setIsSearchModalOpen(true);
  };

  const handleOpenEditMember = (bandMemberId: string) => {
    setEditingMemberId(bandMemberId);
    setIsSearchModalOpen(true);
  };

  const handleToggleMember = (member: BandMemberListItem) => {
    // 팀 리더(생성자)는 해제 불가
    if (creatorMember && member.bandMemberId === creatorMember.bandMemberId) {
      return;
    }
    setSelectedMembers((prev) => {
      const exists = prev.some((m) => m.bandMemberId === member.bandMemberId);
      if (exists) {
        setSession(member.bandMemberId, null);
        return prev.filter((m) => m.bandMemberId !== member.bandMemberId);
      }
      return [...prev, member];
    });
  };

  const handleSelectModalMember = (member: BandMemberListItem) => {
    // 1. 돋보기 버튼을 통한 특정 팀원 수정/교체 모드
    if (editingMemberId) {
      if (editingMemberId === member.bandMemberId) {
        // 자기 자신을 그대로 누르면 해제/제거 (리더는 제거 방지)
        if (
          !creatorMember ||
          member.bandMemberId !== creatorMember.bandMemberId
        ) {
          setSelectedMembers((prev) =>
            prev.filter((m) => m.bandMemberId !== editingMemberId),
          );
          setSession(editingMemberId, null);
        }
      } else {
        // 이미 다른 슬롯에 존재하는 멤버인 경우 중복 방지 처리
        setSelectedMembers((prev) => {
          const withoutNew = prev.filter(
            (m) => m.bandMemberId !== member.bandMemberId,
          );
          return withoutNew.map((m) =>
            m.bandMemberId === editingMemberId ? member : m,
          );
        });
        // 세션은 행에 붙어 있다. 사람만 바꾸고 맡은 세션은 그대로 넘긴다.
        const movedSession = sessionByMember[editingMemberId] ?? null;
        setSession(editingMemberId, null);
        setSession(member.bandMemberId, movedSession);
      }
      setIsSearchModalOpen(false);
      setEditingMemberId(null);
      return;
    }

    // 2. 일반 팀원 추가 모드
    handleToggleMember(member);
  };

  const handleRemoveMember = (bandMemberId: string) => {
    // 팀 리더(생성자)는 삭제 불가
    if (creatorMember && bandMemberId === creatorMember.bandMemberId) {
      return;
    }
    setSelectedMembers((prev) =>
      prev.filter((m) => m.bandMemberId !== bandMemberId),
    );
    setSession(bandMemberId, null);
  };

  const handleCancel = () => {
    void navigate({
      to: '/band/$bandId/settings',
      params: { bandId },
      search: { tab: 'teams' },
    });
  };

  const handleSubmit = async () => {
    const trimmedName = teamName.trim();
    if (!trimmedName || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 1. 팀 생성 (백엔드 계약: 생성 시 로그인한 밴드 멤버가 자동으로 teamRole: 'LEADER'로 등록됨)
      const created = await createTeam(bandId, { name: trimmedName });

      // 2. 세션까지 포함한 명단을 한 번에 저장한다. 리더 행은 서버가 이미 만들어 뒀으므로
      //    그 teamMemberId를 실어 이어받는다. 리더가 명단에서 빠지면 서버가 400을 낸다.
      const existingRows = await getTeamMembers(created.teamId);
      const existingIds = new Set(existingRows.map((row) => row.bandMemberId));
      await replaceTeamMembers(created.teamId, [
        ...existingRows.map((row) => ({
          teamMemberId: row.teamMemberId,
          bandMemberId: row.bandMemberId,
          skillTypeId: sessionByMember[row.bandMemberId] ?? null,
        })),
        ...selectedMembers
          .filter((m) => !existingIds.has(m.bandMemberId))
          .map((m) => ({
            bandMemberId: m.bandMemberId,
            skillTypeId: sessionByMember[m.bandMemberId] ?? null,
          })),
      ]);

      toast.success(`'${created.name}' 팀이 생성되었습니다.`);
      await queryClient.invalidateQueries({ queryKey: teamKeys.all });

      // 3. 팀 관리 탭으로 이동
      void navigate({
        to: '/band/$bandId/settings',
        params: { bandId },
        search: { tab: 'teams' },
      });
    } catch {
      toast.error('팀 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex w-full flex-col gap-8 pb-6 text-white">
      {/* 상단 타이틀 & 설명 */}
      <div className="flex flex-col gap-2">
        <h2 className="typo-xl-sb text-white">팀 추가</h2>
        <p className="typo-base-r text-grey-300">
          밴드멤버들과 팀을 만들어 합주할 수 있어요
        </p>
      </div>

      {/* 폼 영역 */}
      <div className="flex flex-col gap-8">
        {/* 1. 팀 이름 입력 필드 */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="team-name-input"
            className="flex items-center gap-1 typo-base-sb text-grey-100"
          >
            <span>팀 이름</span>
            <span
              className="size-1 rounded-full bg-[#d6705c]"
              aria-hidden="true"
            />
          </label>
          <div className="border-b border-white/24 px-1 py-3 focus-within:border-primary">
            <input
              id="team-name-input"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="팀 이름을 입력해주세요"
              className="w-full bg-transparent typo-base-sb text-white outline-none placeholder:text-grey-300"
            />
          </div>
        </div>

        {/* 2. 팀 구성 입력 필드 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1 typo-base-sb text-grey-100">
              <span>팀 구성</span>
              <span
                className="size-1 rounded-full bg-[#d6705c]"
                aria-hidden="true"
              />
            </label>

            {/* 팀원 추가 버튼 */}
            <button
              type="button"
              onClick={handleOpenAddMember}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 typo-sm-b text-grey-600 shadow-sm transition-transform active:scale-95"
            >
              <Plus className="size-4" />
              <span>팀원 추가</span>
            </button>
          </div>

          {/* 선택된 팀원 목록 */}
          <div className="flex flex-col gap-3 pt-1">
            {selectedMembers.length === 0 ? (
              <div
                role="button"
                tabIndex={0}
                onClick={handleOpenAddMember}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenAddMember();
                  }
                }}
                className="flex h-14 cursor-pointer items-center justify-between border-b border-white/24 px-4 py-3 text-grey-300 transition-colors hover:text-grey-100"
              >
                <span className="typo-base-r text-grey-300">
                  먼저 세션을 입력해주세요
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-2/60 glass-surface px-3 py-1 typo-xs-sb text-primary">
                  선택하기
                </span>
              </div>
            ) : (
              selectedMembers.map((member) => {
                const isLeader =
                  creatorMember?.bandMemberId === member.bandMemberId;

                return (
                  <div
                    key={member.bandMemberId}
                    className="flex items-center gap-2 py-1"
                  >
                    {/* 1. 좌측: 팀에서 맡을 세션 선택 (팀 상세 수정과 같은 드롭다운) */}
                    <div className="min-w-0 flex-1">
                      <SelectField
                        value={sessionByMember[member.bandMemberId] ?? null}
                        onValueChange={(skillTypeId) =>
                          handleChangeSession(member.bandMemberId, skillTypeId)
                        }
                        options={skillTypes.map((skill) => ({
                          value: skill.id,
                          label: skill.name,
                        }))}
                        placeholder={
                          isSkillTypesLoading
                            ? '세션 불러오는 중…'
                            : isSkillTypesError
                              ? '세션을 불러오지 못했어요'
                              : '세션 선택'
                        }
                        disabled={isSkillTypesLoading || isSkillTypesError}
                        ariaLabel={`${member.nickname} 세션 선택`}
                      />
                    </div>

                    {/* 2. 중간: 프로필 알약 칩 (아바타 + 닉네임) */}
                    <div className="flex h-[44px] shrink-0 items-center gap-2 rounded-full bg-surface-2 glass-surface py-1.5 pr-3.5 pl-1.5 backdrop-blur-sm">
                      <Avatar className="size-8 rounded-full">
                        <AvatarImage src={member.avatarUrl ?? undefined} />
                        <AvatarFallback className="typo-xs-sb">
                          {member.nickname.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="max-w-[70px] truncate typo-sm-sb text-white">
                        {member.nickname}
                      </span>
                    </div>

                    {/* 3. 우측: 원형 검색 버튼 및 삭제 버튼 (작성자/리더는 수정/삭제 불가이므로 미노출) */}
                    {!isLeader && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenEditMember(member.bandMemberId)
                          }
                          aria-label={`${member.nickname} 변경`}
                          className="flex size-[44px] shrink-0 items-center justify-center rounded-full bg-surface-2 glass-surface text-primary transition-opacity hover:opacity-90 active:scale-95"
                        >
                          <Search className="size-5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveMember(member.bandMemberId)
                          }
                          aria-label={`${member.nickname} 제거`}
                          className="flex size-8 shrink-0 items-center justify-center rounded-full text-grey-300 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <X className="size-4" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 하단 액션 버튼 영역 */}
      <div className="mt-auto flex items-center justify-end gap-3 pt-10">
        <Button
          type="button"
          variant="outline"
          size="pill"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="h-[54px] min-w-[90px] border-[#c6c6c8] typo-base-sb text-grey-100"
        >
          취소
        </Button>

        <Button
          type="button"
          variant="shining"
          size="pill"
          onClick={handleSubmit}
          disabled={!teamName.trim() || isSubmitting}
          isLoading={isSubmitting}
          className="h-[54px] min-w-[90px] typo-base-sb"
        >
          추가
        </Button>
      </div>

      {/* 팀원 검색/선택 모달 */}
      <MemberSearchModal
        open={isSearchModalOpen}
        onOpenChange={(open) => {
          setIsSearchModalOpen(open);
          if (!open) setEditingMemberId(null);
        }}
        bandId={bandId}
        selectedIds={
          editingMemberId
            ? [editingMemberId]
            : selectedMembers.map((m) => m.bandMemberId)
        }
        onToggleMember={handleSelectModalMember}
      />
    </div>
  );
};
