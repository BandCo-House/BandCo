import { useState } from 'react';
import { calcPrimarySkillName } from '@/entities/skill';
import {
  ProfileChip,
  ProfileLink,
  useUserSearch,
  type UserSearchItem,
} from '@/entities/user';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
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

  const {
    data: found = [],
    isError,
    isLoading,
    isPlaceholderData,
  } = useUserSearch(keyword, { enabled: open });

  // 지금 보이는 행이 현재 입력에 대한 답이 아닐 수 있는 구간이 셋이다 — debounce가 끝나기 전,
  // 첫 응답 전, 공용 훅이 placeholderData로 옛 결과를 들고 있는 동안. 이때 행을 누르면
  // 엉뚱한 사람이 inviteeUserIds에 실린다. 목록 대신 로딩을 보여준다.
  const isResultStale =
    query.trim() !== keyword || isLoading || isPlaceholderData;

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
    if (isResultStale) {
      return <p className="typo-sm-sb text-grey-200">검색 중입니다.</p>;
    }
    if (candidates.length === 0) {
      return <EmptyState title="검색 결과가 없습니다." />;
    }

    return candidates.map((user) => {
      const isSelected = selectedIds.has(user.id);
      return (
        <div key={user.id} className="flex items-center">
          <button
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(user)}
            className="flex min-w-0 flex-1 rounded-md focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ProfileChip
              variant="search"
              selected={isSelected}
              nickname={user.nickname}
              handle={user.handle}
              avatarUrl={user.avatarUrl}
              sessionName={calcPrimarySkillName(user.skills)}
            />
          </button>
          <ProfileLink userId={user.id} nickname={user.nickname} />
        </div>
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
