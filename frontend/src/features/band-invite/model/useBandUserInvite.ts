import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { useUserSearch, type UserSearchItem } from '@/entities/user';
import { createInvite } from '@/features/invite-create/api/invite-api';

export interface UseBandUserInviteProps {
  bandId: string;
  initialQuery?: string;
  isOpen: boolean;
  onSuccess?: (invitedCount: number) => void;
  onClose?: () => void;
}

export function useBandUserInvite({
  bandId,
  initialQuery = '',
  isOpen,
  onSuccess,
  onClose,
}: UseBandUserInviteProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedUsers, setSelectedUsers] = useState<Map<string, UserSearchItem>>(
    new Map(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
    } else {
      setQuery('');
      setSelectedUsers(new Map());
      setIsSubmitting(false);
    }
  }, [isOpen, initialQuery]);

  const debouncedQuery = useDebouncedValue(query, 300);
  const {
    data: searchResults = [],
    isLoading,
    isFetching,
  } = useUserSearch(debouncedQuery, {
    enabled: isOpen && debouncedQuery.trim().length > 0,
  });

  const toggleUser = useCallback((user: UserSearchItem) => {
    setSelectedUsers((prev) => {
      const next = new Map(prev);
      if (next.has(user.id)) {
        next.delete(user.id);
      } else {
        next.set(user.id, user);
      }
      return next;
    });
  }, []);

  const removeUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const handleInvite = async () => {
    const usersToInvite = Array.from(selectedUsers.values());
    if (usersToInvite.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const results = await Promise.allSettled(
        usersToInvite.map((user) =>
          createInvite(bandId, { inviteeUserId: user.id }),
        ),
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      if (failed.length === 0) {
        toast.success(
          usersToInvite.length === 1
            ? `${usersToInvite[0].nickname}님에게 초대장을 전송했습니다.`
            : `${usersToInvite.length}명에게 초대장을 전송했습니다.`,
        );
      } else if (succeeded.length > 0) {
        toast.warning(
          `${succeeded.length}명 전송 성공, ${failed.length}명 전송 실패 (이미 멤버이거나 초대 진행 중)`,
        );
      } else {
        toast.error('초대 전송에 실패했습니다. 이미 멤버이거나 초대가 존재할 수 있습니다.');
      }

      onSuccess?.(succeeded.length);
      onClose?.();
    } catch {
      toast.error('초대 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    query,
    setQuery,
    selectedUsers: Array.from(selectedUsers.values()),
    selectedCount: selectedUsers.size,
    isUserSelected: (userId: string) => selectedUsers.has(userId),
    toggleUser,
    removeUser,
    searchResults,
    isLoading: isLoading || isFetching,
    isSubmitting,
    handleInvite,
  };
}
