import { useState } from 'react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { useBandMembers } from '@/entities/member/api/useBandMembers';
import { useBandTeams } from '@/entities/team/api/queries';
import type { BandMemberListItem } from '@/entities/member/model/types';
import {
  Dialog,
  AppDialogClose,
  AppDialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { cn } from '@/shared/lib/utils';
import { MEMBER_PICKER_TAKE } from '@/shared/lib/member-picker';

interface MemberSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
  /** 이미 참여자로 선택된 bandMemberId 집합. */
  selectedIds: string[];
  /** 멤버 행 탭 시 추가/해제. 선택된 멤버 전체 정보를 넘긴다. */
  onToggleMember: (member: BandMemberListItem) => void;
  /** 팀 행 탭 시 그 팀을 통째로 반영한다. */
  onSelectTeam?: (teamId: string) => void;
  /** 팀 조회가 도는 중. 응답을 기다리는 동안 팀 행을 잠근다. */
  isSelectingTeam?: boolean;
  /** 세션 편성처럼 한 명만 고르는 화면. 행에 라디오 의미를 준다. */
  singleSelect?: boolean;
}

type Tab = 'member' | 'team';

const primarySession = (member: BandMemberListItem): string | undefined =>
  (member.skills.find((s) => s.isPrimary) ?? member.skills[0])?.skillName;

/** 라우팅 미연동(프로필/상세보기)용 우측 링크 버튼. 지금은 no-op. */
const RowLink = ({ label }: { label: string }) => (
  <button
    type="button"
    // TODO: 프로필/팀 상세 라우팅 연동 예정. 지금은 닫기(X)만 동작.
    className="flex shrink-0 items-center gap-2.5 rounded-3xl px-3 py-2 text-grey-200"
  >
    <span className="typo-sm-sb">{label}</span>
    <ArrowRightIcon aria-hidden="true" className="size-4" />
  </button>
);

/**
 * 멤버/팀 검색 모달.
 * - 멤버 탭: 기본은 여러 명 토글, `singleSelect`면 한 명만 고르고 닫힌다
 * - 팀 탭: 행을 탭하면 그 팀을 통째로 반영한다
 * 프로필/상세보기 라우팅은 아직 미연동.
 */
export const MemberSearchModal = ({
  open,
  onOpenChange,
  bandId,
  selectedIds,
  onToggleMember,
  onSelectTeam,
  isSelectingTeam = false,
  singleSelect = false,
}: MemberSearchModalProps) => {
  const [tab, setTab] = useState<Tab>('member');
  const [query, setQuery] = useState('');

  const { data: members = [] } = useBandMembers(bandId, {
    take: MEMBER_PICKER_TAKE,
  });
  const { data: teams = [] } = useBandTeams(bandId, {}, { enabled: open });

  const keyword = query.trim();
  const filteredMembers = keyword
    ? members.filter((m) => m.nickname.includes(keyword))
    : members;
  const filteredTeams = keyword
    ? teams.filter((t) => t.name.includes(keyword))
    : teams;
  const selected = new Set(selectedIds);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent
        size="full"
        className="max-h-[70dvh] gap-8 text-grey-50"
      >
        <DialogTitle className="sr-only">멤버·팀 검색</DialogTitle>
        <DialogDescription className="sr-only">
          이름으로 멤버 또는 팀을 검색해 참여자로 추가합니다.
        </DialogDescription>

        <div className="relative z-10 flex items-center gap-8">
          <div className="flex flex-1 items-center gap-7 typo-lg-sb">
            <button
              type="button"
              aria-pressed={tab === 'member'}
              onClick={() => setTab('member')}
              className={tab === 'member' ? 'text-grey-50' : 'text-grey-300'}
            >
              멤버 검색
            </button>
            <button
              type="button"
              aria-pressed={tab === 'team'}
              onClick={() => setTab('team')}
              className={tab === 'team' ? 'text-grey-50' : 'text-grey-300'}
            >
              팀 검색
            </button>
          </div>
          <AppDialogClose />
        </div>

        <Input
          isSearchBar
          variant="roundedFull"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            tab === 'member'
              ? '이름으로 멤버를 검색하세요'
              : '이름으로 팀을 검색하세요'
          }
          className="relative z-10 h-[54px] border-white/24 bg-grey-500/24 pl-12 typo-base-sb"
        />

        <div
          className="relative z-10 flex min-h-0 scrollbar-glass flex-1 flex-col gap-2 overflow-y-auto"
          role={singleSelect && tab === 'member' ? 'radiogroup' : undefined}
          aria-label={
            singleSelect && tab === 'member' ? '멤버 선택' : undefined
          }
        >
          {tab === 'member' ? (
            filteredMembers.length === 0 ? (
              <p className="py-8 text-center typo-sm-r text-grey-300">
                검색 결과가 없어요.
              </p>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.bandMemberId}
                  className="flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    role={singleSelect ? 'radio' : undefined}
                    aria-checked={
                      singleSelect
                        ? selected.has(member.bandMemberId)
                        : undefined
                    }
                    aria-pressed={
                      singleSelect
                        ? undefined
                        : selected.has(member.bandMemberId)
                    }
                    onClick={() => onToggleMember(member)}
                    className={cn(
                      'flex flex-1 items-center justify-between gap-2 rounded-[20px] border bg-surface-3 p-2 transition-colors',
                      selected.has(member.bandMemberId)
                        ? 'border-primary'
                        : 'border-surface-2',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Avatar size="default">
                        <AvatarImage src={member.avatarUrl ?? undefined} />
                        <AvatarFallback>
                          {member.nickname.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="typo-sm-sb text-grey-50">
                        {member.nickname}
                      </span>
                    </span>
                    {primarySession(member) && (
                      <span className="px-1.5 typo-xs-r text-grey-200">
                        {primarySession(member)}
                      </span>
                    )}
                  </button>
                  <RowLink label="프로필" />
                </div>
              ))
            )
          ) : filteredTeams.length === 0 ? (
            <p className="py-8 text-center typo-sm-r text-grey-300">
              검색 결과가 없어요.
            </p>
          ) : (
            filteredTeams.map((team) => (
              <div
                key={team.teamId}
                className="flex items-center justify-between gap-2"
              >
                {/* 팀을 고르는 화면이 아닌 호출부(팀 상세·팀 생성 등)에서는 눌리는
                    컨트롤로 만들지 않는다 — 포커스만 먹고 아무 일도 안 하게 된다. */}
                {onSelectTeam ? (
                  <button
                    type="button"
                    onClick={() => onSelectTeam(team.teamId)}
                    disabled={isSelectingTeam}
                    className="flex flex-1 items-center gap-2.5 rounded-[20px] border border-surface-2 bg-surface-3 px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="typo-sm-sb text-grey-50">{team.name}</span>
                    <span className="px-1.5 typo-xs-r text-grey-200">
                      {team.memberCount}명
                    </span>
                  </button>
                ) : (
                  <div className="flex flex-1 items-center gap-2.5 px-3 py-2">
                    <span className="typo-sm-sb text-grey-50">{team.name}</span>
                    <span className="px-1.5 typo-xs-r text-grey-200">
                      {team.memberCount}명
                    </span>
                  </div>
                )}
                <RowLink label="상세보기" />
              </div>
            ))
          )}
        </div>
      </AppDialogContent>
    </Dialog>
  );
};
