import { useState } from 'react';

import { formatNumber } from '@/shared/lib/format';
import { Card } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { Select } from '@/shared/ui/Select';

import { useSignups } from '../api';

const DAY_OPTIONS = [
  { value: '7', label: '최근 7일' },
  { value: '30', label: '최근 30일' },
  { value: '90', label: '최근 90일' },
] as const;

const DEFAULT_DAYS = 30;
const CHART_HEIGHT_PX = 160;
// 막대가 많을 때 x축 라벨이 겹치지 않도록 최대 개수를 제한한다.
const MAX_X_LABELS = 10;

export const SignupsChart = () => {
  const [days, setDays] = useState(DEFAULT_DAYS);
  const { data, isPending, isError } = useSignups(days);

  const renderBody = () => {
    if (isPending) {
      return <LoadingState />;
    }
    if (isError) {
      return <EmptyState title="가입 추이를 불러오지 못했습니다." />;
    }

    const maxCount = Math.max(1, ...data.days.map((day) => day.count));
    const total = data.days.reduce((sum, day) => sum + day.count, 0);
    const labelStep = Math.ceil(data.days.length / MAX_X_LABELS);

    return (
      <div>
        <p className="mb-3 text-sm text-slate-600">
          기간 합계{' '}
          <span className="font-semibold text-slate-900">
            {formatNumber(total)}명
          </span>
        </p>
        <div
          className="flex items-end gap-px border-b border-slate-200"
          style={{ height: CHART_HEIGHT_PX }}
        >
          {data.days.map((day) => (
            <div
              key={day.date}
              className="group relative flex h-full flex-1 items-end"
              title={`${day.date}: ${formatNumber(day.count)}명`}
            >
              <div
                className="w-full rounded-t-sm bg-sky-500 group-hover:bg-sky-700"
                style={{
                  height: `${(day.count / maxCount) * 100}%`,
                  minHeight: day.count > 0 ? 2 : 0,
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-px text-[10px] text-slate-400">
          {data.days.map((day, index) => (
            <div key={day.date} className="flex-1 overflow-visible">
              {index % labelStep === 0 ? day.date.slice(5) : ''}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card
      title="일별 가입자"
      description="KST 기준, 오늘 포함"
      actions={
        <Select
          value={String(days)}
          onChange={(event) => setDays(Number(event.target.value))}
          options={DAY_OPTIONS}
          aria-label="조회 기간"
        />
      }
    >
      {renderBody()}
    </Card>
  );
};
