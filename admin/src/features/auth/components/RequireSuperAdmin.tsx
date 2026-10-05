import type { ReactNode } from 'react';

import { EmptyState } from '@/shared/ui/EmptyState';

import { useIsSuperAdmin } from '../api';

/** 최고 관리자 전용 화면. 운영자가 URL로 직접 들어와도 내용을 보여주지 않는다. */
export const RequireSuperAdmin = ({ children }: { children: ReactNode }) => {
  const isSuperAdmin = useIsSuperAdmin();

  if (!isSuperAdmin) {
    return (
      <EmptyState
        title="최고 관리자만 접근할 수 있습니다."
        description="필요하면 최고 관리자에게 요청해 주세요."
      />
    );
  }

  return children;
};
