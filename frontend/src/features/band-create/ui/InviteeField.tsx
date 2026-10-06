import { useState } from 'react';
import { Search, X } from 'lucide-react';
import type { UserSearchItem } from '@/entities/user';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { fieldSurfaceClass } from '@/shared/ui/field';
import { InviteeSearchModal } from './InviteeSearchModal';

type InviteeFieldProps = {
  /** 초대 대상으로 고른 유저. 폼이 소유하고 생성 요청의 inviteeUserIds가 된다. */
  selected: UserSearchItem[];
  onAdd: (user: UserSearchItem) => void;
  onRemove: (userId: string) => void;
  /** 로그인 사용자 ID. 밴드 생성자는 초대 대상이 될 수 없어 후보에서 뺀다. */
  currentUserId?: string | null;
};

/**
 * 밴드 만들기의 멤버 초대 필드.
 *
 * 밴드가 아직 없는 시점이라 초대 전송 API를 쓸 수 없다. 고른 유저는 생성 요청의
 * `inviteeUserIds`로 함께 넘어가고, 서버가 밴드 생성과 같은 트랜잭션에서 초대를 만든다.
 */
export const InviteeField = ({
  selected,
  onAdd,
  onRemove,
  currentUserId,
}: InviteeFieldProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggle = (user: UserSearchItem) => {
    if (selected.some((invitee) => invitee.id === user.id)) {
      onRemove(user.id);
      return;
    }
    onAdd(user);
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="typo-lg-sb">멤버 초대</span>

      {/* 일정 생성의 참여자 필드와 같은 모양 — 필드를 누르면 검색 모달이 열린다. */}
      <button
        type="button"
        onClick={() => setIsSearchOpen(true)}
        className={cn(
          fieldSurfaceClass,
          'flex w-full items-center gap-3 typo-base-sb text-grey-300 focus-visible:outline-2 focus-visible:outline-primary',
        )}
      >
        <Search aria-hidden="true" className="size-6 shrink-0 text-grey-300" />
        <span>
          {selected.length > 0
            ? `${selected.length}명을 초대해요`
            : '이름으로 검색하세요'}
        </span>
      </button>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((user) => (
            <li key={user.id}>
              <span className="flex items-center gap-2 rounded-full border border-primary bg-surface-3 py-1 pr-2 pl-1 typo-sm-sb text-grey-50">
                <Avatar size="sm" aria-hidden="true">
                  <AvatarImage src={user.avatarUrl ?? undefined} />
                  <AvatarFallback>{user.nickname.slice(0, 1)}</AvatarFallback>
                </Avatar>
                {user.nickname}
                <button
                  type="button"
                  aria-label={`${user.nickname} 초대 취소`}
                  onClick={() => onRemove(user.id)}
                  className="text-grey-200 transition-colors hover:text-grey-50 focus-visible:text-grey-50 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <X className="size-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <InviteeSearchModal
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        selected={selected}
        onToggle={toggle}
        currentUserId={currentUserId}
      />
    </div>
  );
};
