import { Badge } from '@/shared/ui/Badge';

import { USER_STATUS_LABELS } from '../labels';
import type { AdminUserListItem } from '../types';

type UserStateBadgeProps = Pick<
  AdminUserListItem,
  'status' | 'isDeleted' | 'isSuspended'
>;

/** 탈퇴 > 이용 정지 > 활성/비활성 순으로 하나만 보여준다. */
export const UserStateBadge = ({
  status,
  isDeleted,
  isSuspended,
}: UserStateBadgeProps) => {
  if (isDeleted) {
    return <Badge tone="gray">탈퇴</Badge>;
  }
  if (isSuspended) {
    return <Badge tone="red">이용 정지</Badge>;
  }
  return (
    <Badge tone={status === 'ACTIVE' ? 'green' : 'yellow'}>
      {USER_STATUS_LABELS[status]}
    </Badge>
  );
};
