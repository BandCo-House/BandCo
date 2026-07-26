import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useBandMembers } from '@/entities/member/api/useBandMembers';
import type { BandMemberListItem } from '@/entities/member/model/types';
import { Checkbox } from '@/shared/ui/checkbox';
import { FieldLabel } from '@/shared/ui/field';
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
 */
export const ParticipantSection = ({
  bandId,
  value,
  onChange,
}: ParticipantSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: members = [] } = useBandMembers(bandId);

  const memberById = new Map(members.map((m) => [m.bandMemberId, m]));
  const specialMembers = members.filter((m) => isSpecial(m.role));
  const selected = new Set(value);

  const toggle = (id: string) =>
    onChange(
      selected.has(id) ? value.filter((mId) => mId !== id) : [...value, id],
    );
  const selectAll = () => onChange(members.map((m) => m.bandMemberId));

  // 카드 순서: 리더/부리더(최상단) → 그 외(추가 순서).
  const picked = value
    .map((id) => memberById.get(id))
    .filter((m): m is BandMemberListItem => Boolean(m));
  const orderedCards = [
    ...picked.filter((m) => isSpecial(m.role)),
    ...picked.filter((m) => !isSpecial(m.role)),
  ];

  return (
    <section className="flex flex-col gap-3">
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
        className="flex h-[54px] w-full items-center justify-between rounded-full field-border border-white/24 bg-grey-500/24 px-5 typo-base-sb text-grey-300"
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
            onCheckedChange={() => toggle(member.bandMemberId)}
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
      {orderedCards.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {orderedCards.map((member) => {
            const special = isSpecial(member.role);
            return (
              <MemberCard
                key={member.bandMemberId}
                name={member.nickname}
                note={member.instrument}
                sessions={member.skills.map((s) => s.skillName)}
                badge={badgeFor(member.role)}
                className={cn(!special && 'min-h-[92px]')}
                onRemove={
                  special ? undefined : () => toggle(member.bandMemberId)
                }
              />
            );
          })}
        </div>
      )}

      <MemberSearchModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        bandId={bandId}
        selectedIds={value}
        onToggleMember={toggle}
      />
    </section>
  );
};
