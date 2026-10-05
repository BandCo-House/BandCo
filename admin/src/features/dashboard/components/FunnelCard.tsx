import { useState, type FormEvent } from 'react';

import {
  formatKstDate,
  formatNumber,
  formatPercent,
  getKstDateDaysAgo,
} from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { Input } from '@/shared/ui/Input';

import { useFunnel } from '../api';
import type { FunnelQuery } from '../types';

// 백엔드 기본값과 같은 최근 30일(오늘 포함)
const DEFAULT_RANGE_DAYS = 30;

const createDefaultRange = (): Required<FunnelQuery> => {
  const now = new Date();
  return {
    from: getKstDateDaysAgo(DEFAULT_RANGE_DAYS - 1, now),
    to: formatKstDate(now),
  };
};

export const FunnelCard = () => {
  const [range, setRange] = useState(createDefaultRange);
  const [draft, setDraft] = useState(range);
  const { data, isPending, isError, isFetching } = useFunnel(range);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setRange(draft);
  };

  const renderBody = () => {
    if (isPending) {
      return <LoadingState />;
    }
    if (isError) {
      return <EmptyState title="퍼널을 불러오지 못했습니다." />;
    }

    const firstCount = data.steps[0]?.count ?? 0;

    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          {data.from} ~ {data.to} 가입 코호트
        </p>
        {data.steps.map((step, index) => {
          const previousCount =
            index === 0 ? step.count : data.steps[index - 1].count;
          const widthPercent =
            firstCount > 0 ? (step.count / firstCount) * 100 : 0;

          return (
            <div key={step.key}>
              <div className="mb-1 flex items-baseline justify-between gap-4 text-sm">
                <span className="font-medium text-slate-800">
                  {index + 1}. {step.label}
                </span>
                <span className="text-slate-900">
                  {formatNumber(step.count)}명
                </span>
              </div>
              <div className="h-6 rounded bg-slate-100">
                <div
                  className="h-full rounded bg-violet-500"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              {index > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  이전 단계 대비 {formatPercent(step.count, previousCount)} · 첫
                  단계 대비 {formatPercent(step.count, firstCount)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card
      title="가입 퍼널"
      description="기간 내 가입한 회원이 다음 단계까지 간 비율"
      actions={
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            type="date"
            value={draft.from}
            max={draft.to}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, from: event.target.value }))
            }
            aria-label="시작일"
            className="w-36"
          />
          <span className="text-slate-400">~</span>
          <Input
            type="date"
            value={draft.to}
            min={draft.from}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, to: event.target.value }))
            }
            aria-label="종료일"
            className="w-36"
          />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            loading={isFetching}
            disabled={!draft.from || !draft.to}
          >
            조회
          </Button>
        </form>
      }
    >
      {renderBody()}
    </Card>
  );
};
