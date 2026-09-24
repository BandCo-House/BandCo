import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { useSpace } from '@/entities/space/api/useSpace';
import { useSchedulePolls } from '@/entities/schedule-poll/model/queries';
import {
  dateKeysFromStartAts,
  formatDateRanges,
} from '@/entities/schedule-poll/lib/poll-grid';
import { formatClockTime, formatDotDate } from '@/shared/lib/date';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';

interface SchedulePollListProps {
  bandId: string;
  spaceId: string;
}

const MetaRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex items-start gap-2 typo-xs-r">
    <dt className="min-w-12 text-grey-300">{label}</dt>
    <dd className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-1 text-grey-50">
      {children}
    </dd>
  </div>
);

const SchedulePollCard = ({
  bandId,
  spaceId,
  pollId,
  title,
  closesAt,
  voterCount,
  memberCount,
  optionStartAts,
}: {
  bandId: string;
  spaceId: string;
  pollId: string;
  title: string;
  closesAt: string;
  voterCount: number;
  memberCount: number | undefined;
  optionStartAts: string[];
}) => {
  const dateRanges = formatDateRanges(dateKeysFromStartAts(optionStartAts));

  return (
    <Link
      to="/band/$bandId/space/$spaceId/polls/$pollId"
      params={{ bandId, spaceId, pollId }}
      className="block w-full rounded-sm border border-primary-surface bg-surface-3 p-4 focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="truncate typo-base-sb text-grey-50">{title}</p>
          <dl className="flex flex-col gap-1">
            <MetaRow label="참여 인원">
              {voterCount}
              {memberCount !== undefined ? `/${memberCount}` : ''}
            </MetaRow>
            {dateRanges.length > 0 && (
              <MetaRow label="날짜">
                {dateRanges.map((range) => (
                  <span key={range}>{range}</span>
                ))}
              </MetaRow>
            )}
            <MetaRow label="마감 기한">
              <span>{formatDotDate(closesAt)}</span>
              <span>{formatClockTime(closesAt)}</span>
            </MetaRow>
          </dl>
        </div>
        <ArrowRightIcon
          aria-hidden="true"
          className="size-5 shrink-0 text-grey-50"
        />
      </div>
    </Link>
  );
};

/** 일정 투표 목록. 카드의 날짜 구간은 목록 응답의 optionStartAts로 그린다. */
export const SchedulePollList = ({
  bandId,
  spaceId,
}: SchedulePollListProps) => {
  const { data: items = [], isPending, isError } = useSchedulePolls(spaceId);
  const { data: spaceDetail } = useSpace(spaceId);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="typo-lg-sb text-grey-50">일정 투표 목록</h2>
        <p className="typo-sm-r text-grey-200">
          참여 가능한 멤버를 확인해보세요
        </p>
      </header>

      {isError ? (
        // 실패를 빈 목록과 같은 화면으로 보여주면 "투표가 없다"로 오해한다.
        <EmptyState
          title="일정 투표를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요"
          className="py-4"
        />
      ) : items.length === 0 ? (
        !isPending && (
          <div className="flex flex-col items-center gap-2">
            <EmptyState
              title="일정 투표가 없습니다"
              description="일정 투표 탭에서 만들 수 있어요"
              className="py-4"
            />
            <Button asChild variant="shining" className="typo-sm-sb">
              <Link
                to="/band/$bandId/space/$spaceId/polls/new"
                params={{ bandId, spaceId }}
              >
                투표 만들기
              </Link>
            </Button>
          </div>
        )
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.schedulePollId}>
              <SchedulePollCard
                bandId={bandId}
                spaceId={spaceId}
                pollId={item.schedulePollId}
                title={item.name}
                closesAt={item.closesAt}
                voterCount={item.voterCount}
                memberCount={spaceDetail?.memberCount}
                optionStartAts={item.optionStartAts}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
