import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { Pagination as PaginationData } from '@/shared/api/types';
import { formatNumber } from '@/shared/lib/format';

import { Button } from './Button';

interface PaginationProps {
  pagination: PaginationData;
  onChange: (page: number) => void;
}

export const Pagination = ({ pagination, onChange }: PaginationProps) => {
  const { page, size, totalCount, hasNext } = pagination;
  const totalPages = Math.max(1, Math.ceil(totalCount / size));

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-3 py-3 text-xs text-slate-500">
      <span>총 {formatNumber(totalCount)}건</span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="이전 페이지"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <span>
          {page} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={!hasNext}
          onClick={() => onChange(page + 1)}
          aria-label="다음 페이지"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
};
