import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useBandMembers } from '@/entities/member/api/useBandMembers';
import { MEMBER_PICKER_TAKE } from '@/shared/lib/member-picker';
import { getTeamMembers } from '@/entities/team/api/team-api';
import { teamKeys } from '@/entities/team/api/queries';
import type { BandMemberListItem } from '@/entities/member/model/types';
import { Checkbox } from '@/shared/ui/checkbox';
import { FieldLabel, fieldSurfaceClass } from '@/shared/ui/field';
import { cn } from '@/shared/lib/utils';
import { MemberCard } from './MemberCard';
import { MemberSearchModal } from './MemberSearchModal';

interface ParticipantSectionProps {
  bandId: string;
  /** 선택된 참여자 bandMemberId 목록(추가 순서 유지). */
  value: string[];
  onChange: (ids: string[]) => void;
}

/** 리더=BM / 부리더=ADMIN. 체크박스 행으로 노출되며 카드에 뱃지가 붙고 X가 없다. */
const isSpecial = (role: string) => role === 'BM' || role === 'ADMIN';
const badgeFor = (role: string): string | undefined =>
  role === 'BM' ? '리더' : role === 'ADMIN' ? '부리더' : undefined;

/**
 * 합주·회의 공통 참여자 선택.
 * - 전원 선택 링크 / 참여자 인풋(→ 멤버·팀 검색 모달)
 * - 리더·부리더는 체크박스로 추가/해제(카드 최상단·뱃지·X 없음)
 * - 그 외 멤버는 모달로 추가(추가 순서대로 카드·X로 제거)
 * - 팀을 고르면 그 팀 멤버를 한 번에 추가한다(이미 있는 멤버는 건너뛴다)
 */
export const ParticipantSection = ({
  bandId,
  value,
  onChange,
}: ParticipantSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 팀 조회가 끝나기 전에 다른 팀을 또 고르면, 두 호출이 같은 렌더의 value를
  // 캡처해 나중에 끝난 쪽이 먼저 추가된 팀원을 덮어쓴다. 한 번에 하나만 처리한다.
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const queryClient = useQueryClient();
  // take를 안 주면 백엔드 기본값이 20이라 21번째 멤버부터 조회에서 빠진다.
  // 그러면 카드가 안 그려져 해제할 수도 없는 참여자가 생긴다.
  const { data: members = [] } = useBandMembers(bandId, {
    take: MEMBER_PICKER_TAKE,
  });

  const memberById = new Map(members.map((m) => [m.bandMemberId, m]));
  const specialMembers = members.filter((m) => isSpecial(m.role));
  const selected = new Set(value);

  const toggle = (member: BandMemberListItem) =>
    onChange(
      selected.has(member.bandMemberId)
        ? value.filter((id) => id !== member.bandMemberId)
        : [...value, member.bandMemberId],
    );
  const selectAll = () => onChange(members.map((m) => m.bandMemberId));

  // 팀 멤버는 목록 응답에 없어 고를 때 한 번 가져온다. fetchQuery라 캐시가 있으면 재요청하지 않는다.
  const selectTeam = async (teamId: string) => {
    if (isAddingTeam) return;
    setIsAddingTeam(true);
    try {
      const teamMembers = await queryClient.fetchQuery({
        queryKey: teamKeys.members(teamId),
        queryFn: () => getTeamMembers(teamId),
      });
      const added = teamMembers
        .map((member) => member.bandMemberId)
        .filter((id) => !selected.has(id));
      if (added.length > 0) onChange([...value, ...added]);
      setIsModalOpen(false);
    } catch {
      toast.error('팀 멤버를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsAddingTeam(false);
    }
  };

  // 카드 순서: 리더/부리더(최상단) → 그 외(추가 순서).
  const picked = value
    .map((id) => memberById.get(id))
    .filter((m): m is BandMemberListItem => Boolean(m));
  const orderedCards = [
    ...picked.filter((m) => isSpecial(m.role)),
    ...picked.filter((m) => !isSpecial(m.role)),
  ];
  // 멤버 목록에서 못 찾은 참여자(삭제된 멤버 등). 카드를 안 그리면 화면에는
  // 없는데 저장 페이로드에는 실려 나가고, 해제할 방법도 없다.
  const unresolvedIds = value.filter((id) => !memberById.has(id));

  return (
    // Field로 감싸지 않는 커스텀 레이아웃이라 그룹 자체에 필수 의미를 부여한다.
    <section
      className="flex flex-col gap-3"
      role="group"
      aria-label="참여자"
      aria-required
    >
      <div className="flex items-center justify-between">
        <FieldLabel required>참여자</FieldLabel>
        <button
          type="button"
          onClick={selectAll}
          className="typo-sm-sb text-grey-300 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
        >
          전원 선택
        </button>
      </div>

      {/* 참여자 인풋(드롭다운형) → 검색 모달 */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={cn(
          fieldSurfaceClass,
          'flex w-full items-center justify-between typo-base-sb text-grey-300',
        )}
      >
        <span>참여자를 선택하세요</span>
        <ChevronDown aria-hidden="true" className="size-6 text-grey-100" />
      </button>

      {/* 리더/부리더 체크박스 행 */}
      {specialMembers.map((member) => (
        <label
          key={member.bandMemberId}
          className="flex cursor-pointer items-center gap-2 rounded-2xl border border-surface-3 bg-white/24 px-4 py-3"
        >
          <Checkbox
            className="size-5"
            checked={selected.has(member.bandMemberId)}
            onCheckedChange={() => toggle(member)}
          />
          <span className="typo-sm-b text-grey-50">{member.nickname}</span>
          {badgeFor(member.role) && (
            <span className="flex h-5 items-center rounded-full bg-surface-1 px-2 text-xs leading-[1.4] font-medium text-grey-500">
              {badgeFor(member.role)}
            </span>
          )}
          <span className="ml-auto flex items-center gap-2 text-xs leading-[1.3] font-bold text-grey-200">
            {member.skills.map((skill, index) => (
              <span key={`${skill.skillTypeId}-${index}`}>
                {skill.skillName}
              </span>
            ))}
          </span>
        </label>
      ))}

      {/* 선택된 참여자 카드 */}
      {(orderedCards.length > 0 || unresolvedIds.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {orderedCards.map((member) => {
            const special = isSpecial(member.role);
            return (
              <MemberCard
                key={member.bandMemberId}
                name={member.nickname}
                sessions={member.skills.map((s) => s.skillName)}
                badge={badgeFor(member.role)}
                className={cn(!special && 'min-h-[92px]')}
                onRemove={special ? undefined : () => toggle(member)}
              />
            );
          })}
          {unresolvedIds.map((id) => (
            <MemberCard
              key={id}
              name="알 수 없는 멤버"
              className="min-h-[92px]"
              onRemove={() => onChange(value.filter((v) => v !== id))}
            />
          ))}
        </div>
      )}

      <MemberSearchModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        bandId={bandId}
        selectedIds={value}
        onToggleMember={toggle}
        onSelectTeam={(teamId) => void selectTeam(teamId)}
        isSelectingTeam={isAddingTeam}
      />
    </section>
  );
};
