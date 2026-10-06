import { useState } from 'react';
import { Check } from 'lucide-react';
import { useUserSearch, type UserSearchItem } from '@/entities/user';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  AppDialogClose,
  AppDialogContent,
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog';
import { EmptyState } from '@/shared/ui/empty-state';
import { Input } from '@/shared/ui/input';

type InviteeSearchModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 이미 초대 대상으로 고른 유저. 행에 선택 상태로 표시한다. */
  selected: UserSearchItem[];
  /** 행을 탭하면 추가/해제. 여러 명을 고를 수 있게 모달은 닫지 않는다. */
  onToggle: (user: UserSearchItem) => void;
  /** 로그인 사용자 ID. 밴드 생성자는 초대 대상이 될 수 없어 결과에서 뺀다. */
  currentUserId?: string | null;
};

const primarySkillName = (user: UserSearchItem): string | undefined =>
  (user.skills?.find((skill) => skill.isPrimary) ?? user.skills?.[0])
    ?.skillName;

/**
 * 닉네임으로 유저를 찾아 초대 대상에 담는 검색 모달.
 *
 * 밴드 멤버를 고르는 `MemberSearchModal`과 모양은 같지만 모집단이 다르다 — 저쪽은 그 밴드의
 * 멤버 목록을 받아 클라이언트에서 거르고, 여기는 밴드가 아직 없어 전체 유저를 서버에서 검색한다.
 */
export const InviteeSearchModal = ({
  open,
  onOpenChange,
  selected,
  onToggle,
  currentUserId,
}: InviteeSearchModalProps) => {
  const [query, setQuery] = useState('');
  const keyword = useDebouncedValue(query.trim());
  // 공용 훅이 placeholderData로 이전 결과를 들고 있어, 검색어가 바뀐 뒤 debounce가 끝나기 전까지
  // 옛 검색어의 결과가 남는다. 그 사이 행을 누르면 엉뚱한 사람이 초대된다.
  const isKeywordSettled = query.trim() === keyword;

  const { data: found = [], isError } = useUserSearch(keyword, {
    enabled: open,
  });

  const selectedIds = new Set(selected.map((user) => user.id));
  // 비활성 유저는 서버가 초대를 거절한다(ACTIVE만 통과). 후보에 두면 생성 직후 실패 안내만 뜬다.
  const candidates = found.filter(
    (user) => user.status === 'ACTIVE' && user.id !== currentUserId,
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setQuery('');
    onOpenChange(nextOpen);
  };

  const results = () => {
    if (!query.trim()) {
      return (
        <EmptyState
          title="이름으로 멤버를 찾아보세요."
          description="초대는 밴드를 만든 뒤에도 보낼 수 있어요."
        />
      );
    }
    if (isError) {
      return (
        <p className="typo-sm-sb text-grey-200">
          검색에 실패했어요. 잠시 후 다시 시도해주세요.
        </p>
      );
    }
    if (!isKeywordSettled) {
      return <p className="typo-sm-sb text-grey-200">검색 중입니다.</p>;
    }
    if (candidates.length === 0) {
      return <EmptyState title="검색 결과가 없습니다." />;
    }

    return candidates.map((user) => {
      const isSelected = selectedIds.has(user.id);
      return (
        <button
          key={user.id}
          type="button"
          aria-pressed={isSelected}
          onClick={() => onToggle(user)}
          className={cn(
            'flex items-center gap-2 rounded-[20px] border bg-surface-3 p-2 text-left transition-colors',
            isSelected ? 'border-primary' : 'border-surface-2',
          )}
        >
          <Avatar size="default" aria-hidden="true">
            <AvatarImage src={user.avatarUrl ?? undefined} />
            <AvatarFallback>{user.nickname.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="typo-sm-sb text-grey-50">{user.nickname}</span>
          {primarySkillName(user) && (
            <span className="px-1.5 typo-xs-r text-grey-200">
              {primarySkillName(user)}
            </span>
          )}
          {/* 선택 상태를 테두리 색으로만 전하지 않는다. */}
          {isSelected && (
            <Check aria-hidden="true" className="ml-auto size-5 text-primary" />
          )}
        </button>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <AppDialogContent
        size="full"
        className="max-h-[70dvh] gap-8 text-grey-50"
      >
        <div className="relative z-10 flex items-center gap-8">
          <DialogTitle className="flex-1 typo-lg-sb">멤버 초대</DialogTitle>
          <AppDialogClose aria-label="멤버 초대 닫기" />
        </div>
        <DialogDescription className="sr-only">
          이름으로 유저를 검색해 새 밴드에 초대할 멤버를 고릅니다.
        </DialogDescription>

        <Input
          isSearchBar
          variant="roundedFull"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="이름으로 검색하세요"
          className="relative z-10 h-[54px] border-white/24 bg-grey-500/24 pl-12 typo-base-sb"
        />

        <div className="relative z-10 flex min-h-0 scrollbar-glass flex-1 flex-col gap-2 overflow-y-auto">
          {results()}
        </div>
      </AppDialogContent>
    </Dialog>
  );
};
