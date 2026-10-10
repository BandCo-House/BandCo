import { X } from 'lucide-react';
import { calcPrimarySkillName } from '@/entities/skill';
import { ProfileChip, ProfileLink } from '@/entities/user';
import {
  Dialog,
  AppDialogContent,
  AppDialogClose,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { useBandUserInvite } from '../model/useBandUserInvite';

export interface BandUserInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
  initialQuery?: string;
  onSuccess?: (invitedCount: number) => void;
}

export const BandUserInviteModal = ({
  open,
  onOpenChange,
  bandId,
  initialQuery = '',
  onSuccess,
}: BandUserInviteModalProps) => {
  const {
    query,
    setQuery,
    selectedUsers,
    selectedCount,
    isUserSelected,
    toggleUser,
    removeUser,
    searchResults,
    isLoading,
    isSubmitting,
    handleInvite,
  } = useBandUserInvite({
    bandId,
    initialQuery,
    isOpen: open,
    onSuccess,
    onClose: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent
        size="full"
        className="max-h-[75dvh] gap-6 text-grey-50"
      >
        <DialogTitle className="sr-only">사용자 검색 및 초대</DialogTitle>
        <DialogDescription className="sr-only">
          사용자를 검색하여 밴드에 직접 초대장을 전송합니다.
        </DialogDescription>

        {/* 헤더: 타이틀과 닫기 버튼 */}
        <div className="relative z-10 flex items-center justify-between">
          <h2 className="typo-lg-sb text-grey-50">사용자 검색</h2>
          <AppDialogClose />
        </div>

        {/* 상단: 다중 선택된 유저 칩 영역 */}
        {selectedCount > 0 && (
          <div className="relative z-10 flex flex-col gap-2">
            <div className="typo-sm-sb text-grey-200">총 {selectedCount}명</div>
            <div className="flex max-h-[88px] scrollbar-glass flex-wrap gap-2 overflow-y-auto">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-1.5 rounded-full border border-surface-2 bg-surface-3 py-1 pr-2 pl-1 typo-xs-sb text-grey-100"
                >
                  <Avatar size="sm" className="size-5">
                    <AvatarImage src={user.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {user.nickname.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.nickname}</span>
                  <button
                    type="button"
                    aria-label={`${user.nickname} 선택 해제`}
                    onClick={() => removeUser(user.id)}
                    className="ml-1 rounded-full p-0.5 text-grey-300 transition-colors hover:bg-surface-1 hover:text-grey-50"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 검색 입력창 */}
        <Input
          isSearchBar
          variant="roundedFull"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="이름으로 검색하세요"
          className="relative z-10 h-[54px] border-white/24 bg-grey-500/24 pl-12 typo-base-sb"
        />

        {/* 검색 결과 리스트 */}
        <div
          className="relative z-10 flex max-h-[260px] min-h-[140px] scrollbar-glass flex-1 flex-col gap-2 overflow-y-auto"
          role="listbox"
          aria-label="검색된 사용자 목록"
        >
          {isLoading ? (
            <p className="py-8 text-center typo-sm-r text-grey-300">
              사용자를 검색하고 있습니다...
            </p>
          ) : query.trim().length === 0 ? (
            <p className="py-8 text-center typo-sm-r text-grey-300">
              초대할 사용자의 닉네임을 입력하세요.
            </p>
          ) : searchResults.length === 0 ? (
            <p className="py-8 text-center typo-sm-r text-grey-300">
              검색 결과가 없어요.
            </p>
          ) : (
            searchResults.map((user) => {
              const selected = isUserSelected(user.id);
              return (
                <div key={user.id} className="flex items-center">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => toggleUser(user)}
                    className="flex min-w-0 flex-1 rounded-md focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <ProfileChip
                      variant="search"
                      selected={selected}
                      nickname={user.nickname}
                      handle={user.handle}
                      avatarUrl={user.avatarUrl}
                      sessionName={calcPrimarySkillName(user.skills)}
                    />
                  </button>
                  <ProfileLink userId={user.id} nickname={user.nickname} />
                </div>
              );
            })
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="relative z-10 flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-grey-300 px-5 py-2.5 typo-sm-sb text-grey-100 hover:bg-surface-2"
          >
            취소
          </Button>
          <Button
            type="button"
            disabled={selectedCount === 0 || isSubmitting}
            onClick={handleInvite}
            className={cn(
              'rounded-full px-6 py-2.5 typo-sm-sb transition-colors',
              selectedCount > 0 && !isSubmitting
                ? 'bg-primary font-semibold text-grey-600 hover:bg-primary/90'
                : 'cursor-not-allowed bg-grey-500 opacity-60',
            )}
          >
            {isSubmitting ? '전송 중...' : '추가'}
          </Button>
        </div>
      </AppDialogContent>
    </Dialog>
  );
};
